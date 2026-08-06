//! MPEG-TS → fragmented MP4 transmuxer for the ship-video engine.
//!
//! Scope (phase 1): H.264 (Annex-B in PES) + AAC (ADTS) inside single-program
//! transport streams — the overwhelming majority of legacy TS-HLS. No MPEG-2
//! video, no AC-3/MP3, no SAMPLE-AES. Container rewrite only, no re-encoding.
//!
//! Compiled to wasm32-freestanding; exports a tiny C ABI consumed by
//! `ts-transmuxer.ts`. All memory is a bump allocator over wasm pages, reset
//! per segment; codec context (SPS/PPS/ASC, timestamp epochs) lives in globals
//! and survives across segments until `ts_reset()`.

const TS_PACKET = 188;
const MAX_SAMPLES = 8192;
const VIDEO_TIMESCALE: u64 = 90000;

// ---------------------------------------------------------------------------
// Bump allocator over wasm linear memory
// ---------------------------------------------------------------------------

extern var __heap_base: u8;

var heap_next: usize = 0;

fn heapBase() usize {
    return @intFromPtr(&__heap_base);
}

fn ensureCapacity(end: usize) void {
    const page_size: usize = 65536;
    const have = @wasmMemorySize(0) * page_size;
    if (end > have) {
        const need_pages = (end - have + page_size - 1) / page_size;
        _ = @wasmMemoryGrow(0, need_pages);
    }
}

fn alloc(len: usize) [*]u8 {
    if (heap_next == 0) heap_next = heapBase();
    const aligned = (heap_next + 7) & ~@as(usize, 7);
    ensureCapacity(aligned + len);
    heap_next = aligned + len;
    return @ptrFromInt(aligned);
}

export fn ts_alloc(len: usize) [*]u8 {
    return alloc(len);
}

/// Frees everything allocated since the last reset (input + outputs).
export fn ts_heap_reset() void {
    heap_next = heapBase();
}

// ---------------------------------------------------------------------------
// Persistent codec context
// ---------------------------------------------------------------------------

var sps_buf: [256]u8 = undefined;
var sps_len: usize = 0;
var pps_buf: [256]u8 = undefined;
var pps_len: usize = 0;
var video_width: u32 = 0;
var video_height: u32 = 0;

var audio_object_type: u8 = 0;
var audio_sample_rate: u32 = 0;
var audio_channels: u8 = 0;
var audio_sr_index: u8 = 0;

var have_video: bool = false;
var have_audio: bool = false;
var config_written: bool = false;

var last_video_dts: u64 = 0;
var has_last_video_dts: bool = false;
var last_audio_pts: u64 = 0;
var has_last_audio_pts: bool = false;
var moof_sequence: u32 = 0;
// Streams often start at arbitrary DTS (broadcast clocks); rebase to 0 so the
// media timeline matches the playlist timeline like fMP4 streams do.
var ts_base: u64 = 0;
var has_ts_base: bool = false;

export fn ts_reset() void {
    sps_len = 0;
    pps_len = 0;
    video_width = 0;
    video_height = 0;
    audio_object_type = 0;
    audio_sample_rate = 0;
    audio_channels = 0;
    audio_sr_index = 0;
    have_video = false;
    have_audio = false;
    config_written = false;
    last_video_dts = 0;
    has_last_video_dts = false;
    last_audio_pts = 0;
    has_last_audio_pts = false;
    moof_sequence = 0;
    ts_base = 0;
    has_ts_base = false;
}

// ---------------------------------------------------------------------------
// Results (read by JS via exported getters)
// ---------------------------------------------------------------------------

var result_init_ptr: usize = 0;
var result_init_len: usize = 0;
var result_media_ptr: usize = 0;
var result_media_len: usize = 0;
var video_codec_buf: [32]u8 = undefined;
var video_codec_len: usize = 0;
var audio_codec_buf: [32]u8 = undefined;
var audio_codec_len: usize = 0;

export fn ts_result_init_ptr() usize {
    return result_init_ptr;
}
export fn ts_result_init_len() usize {
    return result_init_len;
}
export fn ts_result_media_ptr() usize {
    return result_media_ptr;
}
export fn ts_result_media_len() usize {
    return result_media_len;
}
export fn ts_video_codec_ptr() usize {
    return @intFromPtr(&video_codec_buf);
}
export fn ts_video_codec_len() usize {
    return video_codec_len;
}
export fn ts_audio_codec_ptr() usize {
    return @intFromPtr(&audio_codec_buf);
}
export fn ts_audio_codec_len() usize {
    return audio_codec_len;
}

// ---------------------------------------------------------------------------
// Per-segment scratch state
// ---------------------------------------------------------------------------

const Pes = struct {
    off: usize,
    len: usize,
    pts: u64,
    dts: u64,
    has_pts: bool,
};

const Sample = struct {
    off: usize,
    len: usize,
    dts: u64,
    cts: i32,
    key: bool,
};

var video_pes: [MAX_SAMPLES]Pes = undefined;
var video_pes_count: usize = 0;
var audio_pes: [MAX_SAMPLES]Pes = undefined;
var audio_pes_count: usize = 0;

var video_samples: [MAX_SAMPLES]Sample = undefined;
var video_sample_count: usize = 0;
var audio_samples: [MAX_SAMPLES]Sample = undefined;
var audio_sample_count: usize = 0;

const ERR_NO_SYNC: i32 = -1;
const ERR_UNSUPPORTED_VIDEO: i32 = -2;
const ERR_NO_STREAMS: i32 = -3;
const ERR_OVERFLOW: i32 = -6;
const ERR_NO_CONFIG: i32 = -7;

// ---------------------------------------------------------------------------
// Bit reader (for SPS parsing, over RBSP with emulation prevention removed)
// ---------------------------------------------------------------------------

const BitReader = struct {
    data: []const u8,
    pos: usize = 0, // bit position

    fn bit(self: *BitReader) u32 {
        const byte_index = self.pos >> 3;
        if (byte_index >= self.data.len) return 0;
        const shift: u3 = @intCast(7 - (self.pos & 7));
        self.pos += 1;
        return (self.data[byte_index] >> shift) & 1;
    }

    fn bits(self: *BitReader, count: u6) u32 {
        var value: u32 = 0;
        var i: u6 = 0;
        while (i < count) : (i += 1) {
            value = (value << 1) | self.bit();
        }
        return value;
    }

    fn ue(self: *BitReader) u32 {
        var zeros: u6 = 0;
        while (self.bit() == 0 and zeros < 32) zeros += 1;
        if (zeros == 0) return 0;
        return (@as(u32, 1) << @intCast(zeros)) - 1 + self.bits(zeros);
    }

    fn se(self: *BitReader) i32 {
        const value = self.ue();
        const half: i64 = @intCast((value + 1) / 2);
        return if (value & 1 == 1) @intCast(half) else @intCast(-half);
    }
};

fn parseSpsDimensions(sps: []const u8) void {
    // strip emulation prevention bytes into a scratch copy
    var rbsp: [256]u8 = undefined;
    var rbsp_len: usize = 0;
    var i: usize = 1; // skip NAL header byte
    while (i < sps.len and rbsp_len < rbsp.len) : (i += 1) {
        if (i + 2 < sps.len and sps[i] == 0 and sps[i + 1] == 0 and sps[i + 2] == 3) {
            rbsp[rbsp_len] = 0;
            rbsp[rbsp_len + 1] = 0;
            rbsp_len += 2;
            i += 2;
            continue;
        }
        rbsp[rbsp_len] = sps[i];
        rbsp_len += 1;
    }

    var reader = BitReader{ .data = rbsp[0..rbsp_len] };
    const profile = reader.bits(8);
    _ = reader.bits(8); // constraint flags + reserved
    _ = reader.bits(8); // level
    _ = reader.ue(); // sps id

    var chroma_format: u32 = 1;
    if (profile == 100 or profile == 110 or profile == 122 or profile == 244 or
        profile == 44 or profile == 83 or profile == 86 or profile == 118 or
        profile == 128 or profile == 138 or profile == 139 or profile == 134)
    {
        chroma_format = reader.ue();
        if (chroma_format == 3) _ = reader.bit(); // separate colour plane
        _ = reader.ue(); // bit_depth_luma
        _ = reader.ue(); // bit_depth_chroma
        _ = reader.bit(); // qpprime
        if (reader.bit() == 1) { // seq_scaling_matrix_present
            const count: usize = if (chroma_format == 3) 12 else 8;
            var list: usize = 0;
            while (list < count) : (list += 1) {
                if (reader.bit() == 1) {
                    const size: usize = if (list < 6) 16 else 64;
                    var last: i32 = 8;
                    var next: i32 = 8;
                    var j: usize = 0;
                    while (j < size) : (j += 1) {
                        if (next != 0) next = @mod(last + reader.se() + 256, 256);
                        if (next != 0) last = next;
                    }
                }
            }
        }
    }

    _ = reader.ue(); // log2_max_frame_num
    const poc_type = reader.ue();
    if (poc_type == 0) {
        _ = reader.ue();
    } else if (poc_type == 1) {
        _ = reader.bit();
        _ = reader.se();
        _ = reader.se();
        const cycles = reader.ue();
        var j: u32 = 0;
        while (j < cycles) : (j += 1) _ = reader.se();
    }
    _ = reader.ue(); // max_num_ref_frames
    _ = reader.bit(); // gaps allowed

    const pic_width_mbs = reader.ue() + 1;
    const pic_height_units = reader.ue() + 1;
    const frame_mbs_only = reader.bit();
    if (frame_mbs_only == 0) _ = reader.bit(); // mb_adaptive
    _ = reader.bit(); // direct_8x8

    var crop_left: u32 = 0;
    var crop_right: u32 = 0;
    var crop_top: u32 = 0;
    var crop_bottom: u32 = 0;
    if (reader.bit() == 1) {
        crop_left = reader.ue();
        crop_right = reader.ue();
        crop_top = reader.ue();
        crop_bottom = reader.ue();
    }

    const sub_wc: u32 = if (chroma_format == 1 or chroma_format == 2) 2 else 1;
    const sub_hc: u32 = if (chroma_format == 1) 2 else 1;
    const frame_height_mult: u32 = 2 - frame_mbs_only;

    video_width = pic_width_mbs * 16 -| (crop_left + crop_right) * sub_wc;
    video_height = pic_height_units * 16 * frame_height_mult -| (crop_top + crop_bottom) * sub_hc * frame_height_mult;
}

// ---------------------------------------------------------------------------
// Timestamp handling: 33-bit → continuous 64-bit
// ---------------------------------------------------------------------------

const PTS_WRAP: u64 = 1 << 33;

fn extendTimestamp(reference: u64, has_reference: bool, raw33: u64) u64 {
    if (!has_reference) return raw33;

    const epoch = reference / PTS_WRAP;
    var best = epoch * PTS_WRAP + raw33;
    const ref_i: i64 = @intCast(reference);

    // pick the epoch (previous/current/next) closest to the reference
    var candidate = best;
    if (epoch > 0) {
        candidate = (epoch - 1) * PTS_WRAP + raw33;
        if (absDiff(ref_i, candidate) < absDiff(ref_i, best)) best = candidate;
    }
    candidate = (epoch + 1) * PTS_WRAP + raw33;
    if (absDiff(ref_i, candidate) < absDiff(ref_i, best)) best = candidate;
    return best;
}

fn absDiff(a: i64, b: u64) u64 {
    const b_i: i64 = @intCast(b);
    const diff = a - b_i;
    return if (diff < 0) @intCast(-diff) else @intCast(diff);
}

// ---------------------------------------------------------------------------
// TS demux
// ---------------------------------------------------------------------------

fn read16(data: []const u8, offset: usize) u32 {
    return (@as(u32, data[offset]) << 8) | data[offset + 1];
}

fn parsePesTimestamp(data: []const u8, offset: usize) u64 {
    return (@as(u64, data[offset] & 0x0e) << 29) |
        (@as(u64, data[offset + 1]) << 22) |
        (@as(u64, data[offset + 2] & 0xfe) << 14) |
        (@as(u64, data[offset + 3]) << 7) |
        (@as(u64, data[offset + 4]) >> 1);
}

const StreamAssembly = struct {
    buf: [*]u8,
    cap: usize,
    len: usize = 0,
    pes: []Pes,
    count: *usize,
    open: bool = false,

    fn beginPes(self: *StreamAssembly, pts: u64, dts: u64, has_pts: bool) void {
        self.closePes();
        if (self.count.* >= MAX_SAMPLES) return;
        self.pes[self.count.*] = .{ .off = self.len, .len = 0, .pts = pts, .dts = dts, .has_pts = has_pts };
        self.open = true;
    }

    fn append(self: *StreamAssembly, data: []const u8) void {
        if (!self.open or self.len + data.len > self.cap) return;
        var i: usize = 0;
        while (i < data.len) : (i += 1) self.buf[self.len + i] = data[i];
        self.len += data.len;
    }

    fn closePes(self: *StreamAssembly) void {
        if (!self.open) return;
        self.open = false;
        const entry = &self.pes[self.count.*];
        entry.len = self.len - entry.off;
        if (entry.len > 0) self.count.* += 1;
    }
};

fn handlePesStart(assembly: *StreamAssembly, payload: []const u8) void {
    // PES header: 00 00 01 sid len(2) flags(2) header_len(1) ...
    if (payload.len < 9 or payload[0] != 0 or payload[1] != 0 or payload[2] != 1) return;

    const flags = payload[7];
    const header_len: usize = payload[8];
    var pts: u64 = 0;
    var dts: u64 = 0;
    var has_pts = false;

    if (flags & 0x80 != 0 and payload.len >= 14) {
        pts = parsePesTimestamp(payload, 9);
        dts = pts;
        has_pts = true;
        if (flags & 0x40 != 0 and payload.len >= 19) {
            dts = parsePesTimestamp(payload, 14);
        }
    }

    assembly.beginPes(pts, dts, has_pts);
    const data_start = 9 + header_len;
    if (data_start < payload.len) assembly.append(payload[data_start..]);
}

// ---------------------------------------------------------------------------
// Box writer
// ---------------------------------------------------------------------------

const BoxWriter = struct {
    buf: [*]u8,
    cap: usize,
    len: usize = 0,

    fn u8v(self: *BoxWriter, value: u8) void {
        if (self.len < self.cap) self.buf[self.len] = value;
        self.len += 1;
    }
    fn u16v(self: *BoxWriter, value: u32) void {
        self.u8v(@intCast((value >> 8) & 0xff));
        self.u8v(@intCast(value & 0xff));
    }
    fn u24v(self: *BoxWriter, value: u32) void {
        self.u8v(@intCast((value >> 16) & 0xff));
        self.u16v(value & 0xffff);
    }
    fn u32v(self: *BoxWriter, value: u32) void {
        self.u16v((value >> 16) & 0xffff);
        self.u16v(value & 0xffff);
    }
    fn u64v(self: *BoxWriter, value: u64) void {
        self.u32v(@intCast(value >> 32));
        self.u32v(@intCast(value & 0xffffffff));
    }
    fn tag(self: *BoxWriter, name: *const [4]u8) void {
        self.u8v(name[0]);
        self.u8v(name[1]);
        self.u8v(name[2]);
        self.u8v(name[3]);
    }
    fn raw(self: *BoxWriter, data: []const u8) void {
        for (data) |byte| self.u8v(byte);
    }

    fn open(self: *BoxWriter, name: *const [4]u8) usize {
        const at = self.len;
        self.u32v(0);
        self.tag(name);
        return at;
    }
    fn close(self: *BoxWriter, at: usize) void {
        const size: u32 = @intCast(self.len - at);
        self.buf[at] = @intCast((size >> 24) & 0xff);
        self.buf[at + 1] = @intCast((size >> 16) & 0xff);
        self.buf[at + 2] = @intCast((size >> 8) & 0xff);
        self.buf[at + 3] = @intCast(size & 0xff);
    }
};

// ---------------------------------------------------------------------------
// Init segment
// ---------------------------------------------------------------------------

fn writeTkhd(w: *BoxWriter, track_id: u32, width: u32, height: u32, audio: bool) void {
    const at = w.open("tkhd");
    w.u8v(0);
    w.u24v(3); // enabled + in movie
    w.u32v(0); // creation
    w.u32v(0); // modification
    w.u32v(track_id);
    w.u32v(0); // reserved
    w.u32v(0); // duration
    w.u32v(0);
    w.u32v(0); // reserved
    w.u16v(0); // layer
    w.u16v(if (audio) 1 else 0); // alternate group
    w.u16v(if (audio) 0x0100 else 0); // volume
    w.u16v(0); // reserved
    // identity matrix
    w.u32v(0x00010000);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0x00010000);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0x40000000);
    w.u32v(width << 16);
    w.u32v(height << 16);
    w.close(at);
}

fn writeMdhd(w: *BoxWriter, timescale: u32) void {
    const at = w.open("mdhd");
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(timescale);
    w.u32v(0); // duration
    w.u16v(0x55c4); // language 'und'
    w.u16v(0);
    w.close(at);
}

fn writeHdlr(w: *BoxWriter, audio: bool) void {
    const at = w.open("hdlr");
    w.u32v(0);
    w.u32v(0);
    w.tag(if (audio) "soun" else "vide");
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    if (audio) w.raw("SoundHandler") else w.raw("VideoHandler");
    w.u8v(0);
    w.close(at);
}

fn writeDinf(w: *BoxWriter) void {
    const dinf = w.open("dinf");
    const dref = w.open("dref");
    w.u32v(0);
    w.u32v(1);
    const url = w.open("url ");
    w.u8v(0);
    w.u24v(1); // self-contained
    w.close(url);
    w.close(dref);
    w.close(dinf);
}

fn writeEmptyTables(w: *BoxWriter) void {
    const stts = w.open("stts");
    w.u32v(0);
    w.u32v(0);
    w.close(stts);
    const stsc = w.open("stsc");
    w.u32v(0);
    w.u32v(0);
    w.close(stsc);
    const stsz = w.open("stsz");
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.close(stsz);
    const stco = w.open("stco");
    w.u32v(0);
    w.u32v(0);
    w.close(stco);
}

fn writeAvc1(w: *BoxWriter) void {
    const avc1 = w.open("avc1");
    w.u32v(0);
    w.u16v(0);
    w.u16v(1); // data ref index
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u16v(@intCast(video_width & 0xffff));
    w.u16v(@intCast(video_height & 0xffff));
    w.u32v(0x00480000); // 72 dpi
    w.u32v(0x00480000);
    w.u32v(0);
    w.u16v(1); // frame count
    var name_i: usize = 0;
    while (name_i < 32) : (name_i += 1) w.u8v(0); // compressor name
    w.u16v(0x0018); // depth
    w.u16v(0xffff); // pre-defined

    const avcc = w.open("avcC");
    w.u8v(1); // configuration version
    w.u8v(sps_buf[1]); // profile
    w.u8v(sps_buf[2]); // compat
    w.u8v(sps_buf[3]); // level
    w.u8v(0xff); // 4-byte NAL lengths
    w.u8v(0xe1); // 1 SPS
    w.u16v(@intCast(sps_len));
    w.raw(sps_buf[0..sps_len]);
    w.u8v(1); // 1 PPS
    w.u16v(@intCast(pps_len));
    w.raw(pps_buf[0..pps_len]);
    w.close(avcc);
    w.close(avc1);
}

fn writeMp4a(w: *BoxWriter) void {
    const mp4a = w.open("mp4a");
    w.u32v(0);
    w.u16v(0);
    w.u16v(1); // data ref index
    w.u32v(0);
    w.u32v(0);
    w.u16v(audio_channels);
    w.u16v(16); // sample size
    w.u32v(0);
    w.u32v(audio_sample_rate << 16);

    const esds = w.open("esds");
    w.u32v(0);
    // ES_Descriptor
    w.u8v(0x03);
    w.u8v(23); // size: 3 + 15 (DecoderConfig) + 5 (asc hdr+2) ... computed below
    w.u16v(2); // ES id
    w.u8v(0);
    // DecoderConfigDescriptor
    w.u8v(0x04);
    w.u8v(15);
    w.u8v(0x40); // AAC
    w.u8v(0x15); // audio stream
    w.u24v(0); // buffer size
    w.u32v(0); // max bitrate
    w.u32v(0); // avg bitrate
    // DecoderSpecificInfo (AudioSpecificConfig)
    w.u8v(0x05);
    w.u8v(2);
    w.u8v((audio_object_type << 3) | (audio_sr_index >> 1));
    w.u8v(((audio_sr_index & 1) << 7) | (audio_channels << 3));
    // SLConfigDescriptor
    w.u8v(0x06);
    w.u8v(1);
    w.u8v(0x02);
    w.close(esds);
    w.close(mp4a);
}

fn writeTrak(w: *BoxWriter, audio: bool) void {
    const trak = w.open("trak");
    writeTkhd(w, if (audio) 2 else 1, if (audio) 0 else video_width, if (audio) 0 else video_height, audio);
    const mdia = w.open("mdia");
    writeMdhd(w, if (audio) audio_sample_rate else @intCast(VIDEO_TIMESCALE));
    writeHdlr(w, audio);
    const minf = w.open("minf");
    if (audio) {
        const smhd = w.open("smhd");
        w.u32v(0);
        w.u32v(0);
        w.close(smhd);
    } else {
        const vmhd = w.open("vmhd");
        w.u8v(0);
        w.u24v(1);
        w.u64v(0);
        w.close(vmhd);
    }
    writeDinf(w);
    const stbl = w.open("stbl");
    const stsd = w.open("stsd");
    w.u32v(0);
    w.u32v(1);
    if (audio) writeMp4a(w) else writeAvc1(w);
    w.close(stsd);
    writeEmptyTables(w);
    w.close(stbl);
    w.close(minf);
    w.close(mdia);
    w.close(trak);
}

fn writeTrex(w: *BoxWriter, track_id: u32) void {
    const trex = w.open("trex");
    w.u32v(0);
    w.u32v(track_id);
    w.u32v(1); // default sample description
    w.u32v(0);
    w.u32v(0);
    w.u32v(0x00010001);
    w.close(trex);
}

fn writeInitSegment() void {
    const ptr = alloc(2048 + sps_len + pps_len);
    var w = BoxWriter{ .buf = ptr, .cap = 2048 + sps_len + pps_len };

    const ftyp = w.open("ftyp");
    w.tag("isom");
    w.u32v(512);
    w.tag("isom");
    w.tag("iso6");
    w.tag("avc1");
    w.tag("mp41");
    w.close(ftyp);

    const moov = w.open("moov");
    const mvhd = w.open("mvhd");
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(@intCast(VIDEO_TIMESCALE));
    w.u32v(0); // duration
    w.u32v(0x00010000); // rate
    w.u16v(0x0100); // volume
    w.u16v(0);
    w.u64v(0);
    w.u32v(0x00010000);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0x00010000);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0);
    w.u32v(0x40000000);
    var i: usize = 0;
    while (i < 6) : (i += 1) w.u32v(0); // pre-defined
    w.u32v(3); // next track id
    w.close(mvhd);

    if (have_video) writeTrak(&w, false);
    if (have_audio) writeTrak(&w, true);

    const mvex = w.open("mvex");
    if (have_video) writeTrex(&w, 1);
    if (have_audio) writeTrex(&w, 2);
    w.close(mvex);
    w.close(moov);

    result_init_ptr = @intFromPtr(ptr);
    result_init_len = w.len;
}

// ---------------------------------------------------------------------------
// Media segment (moof/mdat per track)
// ---------------------------------------------------------------------------

fn writeTrackFragment(
    w: *BoxWriter,
    track_id: u32,
    samples: []const Sample,
    data: [*]const u8,
    base_decode_time: u64,
    audio: bool,
    audio_default_duration: u32,
) void {
    moof_sequence += 1;

    const moof = w.open("moof");
    const mfhd = w.open("mfhd");
    w.u32v(0);
    w.u32v(moof_sequence);
    w.close(mfhd);

    const traf = w.open("traf");
    const tfhd = w.open("tfhd");
    if (audio) {
        w.u32v(0x020008); // default-base-is-moof | default duration
        w.u32v(track_id);
        w.u32v(audio_default_duration);
    } else {
        w.u32v(0x020000); // default-base-is-moof
        w.u32v(track_id);
    }
    w.close(tfhd);

    const tfdt = w.open("tfdt");
    w.u8v(1);
    w.u24v(0);
    w.u64v(base_decode_time);
    w.close(tfdt);

    const trun = w.open("trun");
    if (audio) {
        w.u8v(0);
        w.u24v(0x000201); // data offset + sample size
    } else {
        w.u8v(0);
        w.u24v(0x000f01); // data offset + duration + size + flags + cts
    }
    w.u32v(@intCast(samples.len));
    const data_offset_at = w.len;
    w.u32v(0); // patched below

    var total: usize = 0;
    for (samples, 0..) |sample, index| {
        if (!audio) {
            // duration = dts delta to next sample; last reuses the previous delta
            var duration: u64 = 3000;
            if (index + 1 < samples.len) {
                duration = samples[index + 1].dts -| sample.dts;
            } else if (index > 0) {
                duration = sample.dts -| samples[index - 1].dts;
            }
            if (duration == 0 or duration > 900000) duration = 3000;
            w.u32v(@intCast(duration));
            w.u32v(@intCast(sample.len));
            w.u32v(if (sample.key) 0x02000000 else 0x01010000);
            w.u32v(@bitCast(sample.cts));
        } else {
            w.u32v(@intCast(sample.len));
        }
        total += sample.len;
    }
    w.close(trun);
    w.close(traf);
    w.close(moof);

    // patch data offset: from moof start to first mdat payload byte
    const mdat_at = w.len;
    const data_offset: u32 = @intCast(w.len - moof + 8);
    w.buf[data_offset_at] = @intCast((data_offset >> 24) & 0xff);
    w.buf[data_offset_at + 1] = @intCast((data_offset >> 16) & 0xff);
    w.buf[data_offset_at + 2] = @intCast((data_offset >> 8) & 0xff);
    w.buf[data_offset_at + 3] = @intCast(data_offset & 0xff);

    const mdat = w.open("mdat");
    _ = mdat;
    for (samples) |sample| {
        w.raw(data[sample.off .. sample.off + sample.len]);
    }
    w.close(mdat_at);
}

// ---------------------------------------------------------------------------
// Elementary stream processing
// ---------------------------------------------------------------------------

fn processVideo(es: [*]const u8, out: *StreamOut) i32 {
    video_sample_count = 0;

    var pes_index: usize = 0;
    while (pes_index < video_pes_count) : (pes_index += 1) {
        const pes = video_pes[pes_index];
        const payload = es[pes.off .. pes.off + pes.len];
        if (!pes.has_pts) continue;

        const dts64 = extendTimestamp(last_video_dts, has_last_video_dts, pes.dts);
        const pts64 = extendTimestamp(dts64, true, pes.pts);
        last_video_dts = dts64;
        has_last_video_dts = true;

        if (!has_ts_base) {
            ts_base = dts64;
            has_ts_base = true;
        }

        if (video_sample_count >= MAX_SAMPLES) return ERR_OVERFLOW;
        const sample = &video_samples[video_sample_count];
        sample.* = .{ .off = out.len, .len = 0, .dts = dts64 -| ts_base, .cts = @intCast(@as(i64, @intCast(pts64)) - @as(i64, @intCast(dts64))), .key = false };

        // walk Annex-B NALs
        var i: usize = 0;
        while (i + 3 < payload.len) {
            // find start code
            if (!(payload[i] == 0 and payload[i + 1] == 0 and (payload[i + 2] == 1 or (payload[i + 2] == 0 and i + 4 < payload.len and payload[i + 3] == 1)))) {
                i += 1;
                continue;
            }
            const nal_start = if (payload[i + 2] == 1) i + 3 else i + 4;
            // find next start code
            var j = nal_start;
            while (j + 3 < payload.len) : (j += 1) {
                if (payload[j] == 0 and payload[j + 1] == 0 and (payload[j + 2] == 1 or (payload[j + 2] == 0 and j + 4 <= payload.len and payload[j + 3] == 1))) break;
            }
            const nal_end = if (j + 3 < payload.len) j else payload.len;
            const nal = payload[nal_start..nal_end];
            i = nal_end;
            if (nal.len == 0) continue;

            const nal_type = nal[0] & 0x1f;
            switch (nal_type) {
                7 => { // SPS
                    if (nal.len <= sps_buf.len and (nal.len != sps_len or !bytesEqual(sps_buf[0..sps_len], nal))) {
                        copyBytes(sps_buf[0..nal.len], nal);
                        sps_len = nal.len;
                        parseSpsDimensions(nal);
                        config_written = false;
                    }
                },
                8 => { // PPS
                    if (nal.len <= pps_buf.len and (nal.len != pps_len or !bytesEqual(pps_buf[0..pps_len], nal))) {
                        copyBytes(pps_buf[0..nal.len], nal);
                        pps_len = nal.len;
                        config_written = false;
                    }
                },
                9 => {}, // AUD — dropped
                12 => {}, // filler — dropped
                else => {
                    if (nal_type == 5) sample.key = true;
                    // AVCC: 4-byte length prefix
                    out.writeU32(@intCast(nal.len));
                    out.append(nal);
                    sample.len += 4 + nal.len;
                },
            }
        }

        if (sample.len > 0) {
            have_video = true;
            video_sample_count += 1;
        }
    }
    return 0;
}

const ADTS_SAMPLE_RATES = [_]u32{ 96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350, 0, 0, 0 };

fn processAudio(es: [*]const u8, es_len: usize, out: *StreamOut) i32 {
    audio_sample_count = 0;
    if (audio_pes_count == 0) return 0;

    // ADTS frames are parsed across the whole PES-concatenated buffer so
    // frames spanning PES boundaries stay intact. The first PES PTS anchors
    // the timeline; subsequent frames advance by exactly 1024 samples.
    var anchor_pts: u64 = 0;
    var have_anchor = false;
    var pes_scan: usize = 0;
    while (pes_scan < audio_pes_count) : (pes_scan += 1) {
        if (audio_pes[pes_scan].has_pts) {
            anchor_pts = extendTimestamp(last_audio_pts, has_last_audio_pts, audio_pes[pes_scan].pts);
            have_anchor = true;
            break;
        }
    }
    if (!have_anchor) return 0;

    if (!has_ts_base) {
        // audio-only stream: anchor the timeline on the first audio PTS
        ts_base = anchor_pts;
        has_ts_base = true;
    }
    // continuity tracking stays in the raw broadcast timeline; samples are rebased
    const anchor_raw = anchor_pts;
    anchor_pts -|= ts_base;

    const buffer = es[0..es_len];
    var i: usize = 0;
    var frame_index: u64 = 0;

    while (i + 7 <= buffer.len) {
        if (!(buffer[i] == 0xff and (buffer[i + 1] & 0xf6) == 0xf0)) {
            i += 1;
            continue;
        }

        const protection_absent = buffer[i + 1] & 1;
        const object_type: u8 = (buffer[i + 2] >> 6) + 1;
        const sr_index: u8 = (buffer[i + 2] >> 2) & 0x0f;
        const channels: u8 = @intCast(((buffer[i + 2] & 1) << 2) | (buffer[i + 3] >> 6));
        const frame_len: usize = (@as(usize, buffer[i + 3] & 0x03) << 11) |
            (@as(usize, buffer[i + 4]) << 3) |
            (buffer[i + 5] >> 5);
        if (frame_len < 7 or i + frame_len > buffer.len) break;

        const header_len: usize = if (protection_absent == 1) 7 else 9;
        const sample_rate = ADTS_SAMPLE_RATES[sr_index];
        if (sample_rate == 0) {
            i += frame_len;
            continue;
        }

        if (audio_sample_rate != sample_rate or audio_channels != channels or audio_object_type != object_type) {
            audio_sample_rate = sample_rate;
            audio_channels = channels;
            audio_object_type = object_type;
            audio_sr_index = sr_index;
            config_written = false;
        }

        if (audio_sample_count >= MAX_SAMPLES) return ERR_OVERFLOW;
        const frame = buffer[i + header_len .. i + frame_len];
        const advance = frame_index * 1024 * VIDEO_TIMESCALE / sample_rate;
        audio_samples[audio_sample_count] = .{ .off = out.len, .len = frame.len, .dts = anchor_pts + advance, .cts = 0, .key = true };
        out.append(frame);
        audio_sample_count += 1;
        have_audio = true;

        last_audio_pts = anchor_raw + advance;
        has_last_audio_pts = true;
        frame_index += 1;
        i += frame_len;
    }
    return 0;
}

const StreamOut = struct {
    buf: [*]u8,
    cap: usize,
    len: usize = 0,
    overflow: bool = false,

    fn append(self: *StreamOut, data: []const u8) void {
        if (self.len + data.len > self.cap) {
            self.overflow = true;
            return;
        }
        var i: usize = 0;
        while (i < data.len) : (i += 1) self.buf[self.len + i] = data[i];
        self.len += data.len;
    }

    fn writeU32(self: *StreamOut, value: u32) void {
        if (self.len + 4 > self.cap) {
            self.overflow = true;
            return;
        }
        self.buf[self.len] = @intCast((value >> 24) & 0xff);
        self.buf[self.len + 1] = @intCast((value >> 16) & 0xff);
        self.buf[self.len + 2] = @intCast((value >> 8) & 0xff);
        self.buf[self.len + 3] = @intCast(value & 0xff);
        self.len += 4;
    }
};

fn bytesEqual(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;
    for (a, b) |x, y| {
        if (x != y) return false;
    }
    return true;
}

fn copyBytes(dest: []u8, src: []const u8) void {
    var i: usize = 0;
    while (i < src.len) : (i += 1) dest[i] = src[i];
}

const HEX = "0123456789abcdef";

fn writeCodecStrings() void {
    if (have_video and sps_len >= 4) {
        const prefix = "avc1.";
        copyBytes(video_codec_buf[0..prefix.len], prefix);
        var pos: usize = prefix.len;
        for (sps_buf[1..4]) |byte| {
            video_codec_buf[pos] = HEX[byte >> 4];
            video_codec_buf[pos + 1] = HEX[byte & 0x0f];
            pos += 2;
        }
        video_codec_len = pos;
    } else {
        video_codec_len = 0;
    }

    if (have_audio) {
        const prefix = "mp4a.40.";
        copyBytes(audio_codec_buf[0..prefix.len], prefix);
        var pos: usize = prefix.len;
        if (audio_object_type >= 10) {
            audio_codec_buf[pos] = '0' + (audio_object_type / 10);
            pos += 1;
        }
        audio_codec_buf[pos] = '0' + (audio_object_type % 10);
        audio_codec_len = pos + 1;
    } else {
        audio_codec_len = 0;
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export fn ts_transmux(input: [*]const u8, input_len: usize) i32 {
    result_init_ptr = 0;
    result_init_len = 0;
    result_media_ptr = 0;
    result_media_len = 0;
    video_pes_count = 0;
    audio_pes_count = 0;
    video_sample_count = 0;
    audio_sample_count = 0;

    if (input_len < TS_PACKET) return ERR_NO_SYNC;

    // resync if the segment doesn't start on a packet boundary
    var start: usize = 0;
    while (start < input_len - TS_PACKET and input[start] != 0x47) start += 1;
    if (input[start] != 0x47) return ERR_NO_SYNC;

    var pmt_pid: u32 = 0;
    var video_pid: u32 = 0;
    var audio_pid: u32 = 0;
    var saw_unsupported_video = false;

    var video_assembly = StreamAssembly{
        .buf = alloc(input_len),
        .cap = input_len,
        .pes = video_pes[0..],
        .count = &video_pes_count,
    };
    var audio_assembly = StreamAssembly{
        .buf = alloc(input_len),
        .cap = input_len,
        .pes = audio_pes[0..],
        .count = &audio_pes_count,
    };

    var offset = start;
    while (offset + TS_PACKET <= input_len) : (offset += TS_PACKET) {
        const packet = input[offset .. offset + TS_PACKET];
        if (packet[0] != 0x47) continue;

        const pusi = (packet[1] & 0x40) != 0;
        const pid = (read16(packet, 1)) & 0x1fff;
        const adaptation = (packet[3] >> 4) & 0x3;

        var payload_start: usize = 4;
        if (adaptation == 2) continue; // adaptation only
        if (adaptation == 3) {
            payload_start = 5 + packet[4];
            if (payload_start >= TS_PACKET) continue;
        }
        const payload = packet[payload_start..];

        if (pid == 0) {
            // PAT: first program's PMT pid
            const table = psiTable(payload, pusi) orelse continue;
            if (table.len < 13) continue;
            var entry: usize = 8;
            while (entry + 4 <= table.len - 4) : (entry += 4) {
                const program = read16(table, entry);
                if (program != 0) {
                    pmt_pid = read16(table, entry + 2) & 0x1fff;
                    break;
                }
            }
        } else if (pmt_pid != 0 and pid == pmt_pid and video_pid == 0 and audio_pid == 0) {
            const table = psiTable(payload, pusi) orelse continue;
            if (table.len < 17) continue;
            const program_info_len = read16(table, 10) & 0x0fff;
            var entry: usize = 12 + program_info_len;
            while (entry + 5 <= table.len - 4) {
                const stream_type = table[entry];
                const es_pid = read16(table, entry + 1) & 0x1fff;
                const es_info_len = read16(table, entry + 3) & 0x0fff;
                switch (stream_type) {
                    0x1b => {
                        if (video_pid == 0) video_pid = es_pid;
                    },
                    0x0f => {
                        if (audio_pid == 0) audio_pid = es_pid;
                    },
                    0x01, 0x02, 0x24 => saw_unsupported_video = true,
                    else => {},
                }
                entry += 5 + es_info_len;
            }
        } else if (pid == video_pid and video_pid != 0) {
            if (pusi) handlePesStart(&video_assembly, payload) else video_assembly.append(payload);
        } else if (pid == audio_pid and audio_pid != 0) {
            if (pusi) handlePesStart(&audio_assembly, payload) else audio_assembly.append(payload);
        }
    }

    video_assembly.closePes();
    audio_assembly.closePes();

    if (video_pid == 0 and audio_pid == 0) {
        return if (saw_unsupported_video) ERR_UNSUPPORTED_VIDEO else ERR_NO_STREAMS;
    }

    // elementary streams → samples. AVCC replaces ≥3-byte start codes with
    // 4-byte lengths, so output is strictly < 2× the Annex-B input.
    const video_cap = video_assembly.len * 2 + 64;
    const video_out_ptr = alloc(video_cap);
    var video_out = StreamOut{ .buf = video_out_ptr, .cap = video_cap };
    const video_status = processVideo(video_assembly.buf, &video_out);
    if (video_status != 0) return video_status;
    if (video_out.overflow) return ERR_OVERFLOW;

    const audio_out_ptr = alloc(audio_assembly.len + 64);
    var audio_out = StreamOut{ .buf = audio_out_ptr, .cap = audio_assembly.len + 64 };
    const audio_status = processAudio(audio_assembly.buf, audio_assembly.len, &audio_out);
    if (audio_status != 0) return audio_status;
    if (audio_out.overflow) return ERR_OVERFLOW;

    if (video_sample_count == 0 and audio_sample_count == 0) return ERR_NO_STREAMS;
    if (have_video and (sps_len == 0 or pps_len == 0)) return ERR_NO_CONFIG;

    writeCodecStrings();

    if (!config_written) {
        writeInitSegment();
        config_written = true;
    }

    // media: moof+mdat per present track
    const media_cap = video_out.len + audio_out.len + 4096 + (video_sample_count + audio_sample_count) * 16;
    const media_ptr = alloc(media_cap);
    var w = BoxWriter{ .buf = media_ptr, .cap = media_cap };

    if (video_sample_count > 0) {
        writeTrackFragment(&w, 1, video_samples[0..video_sample_count], video_out_ptr, video_samples[0].dts, false, 0);
    }
    if (audio_sample_count > 0) {
        // audio timescale = sample rate; frames are exactly 1024 samples
        const base = audio_samples[0].dts * audio_sample_rate / VIDEO_TIMESCALE;
        writeTrackFragment(&w, 2, audio_samples[0..audio_sample_count], audio_out_ptr, base, true, 1024);
    }

    if (w.len > w.cap) return ERR_OVERFLOW;

    result_media_ptr = @intFromPtr(media_ptr);
    result_media_len = w.len;
    return 0;
}

fn psiTable(payload: []const u8, pusi: bool) ?[]const u8 {
    if (!pusi or payload.len < 1) return null;
    const pointer = payload[0];
    const table_start = 1 + @as(usize, pointer);
    if (table_start >= payload.len) return null;
    return payload[table_start..];
}

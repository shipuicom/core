const std = @import("std");

const IconProperties = struct {
    ligatures: ?[]const u8 = null,
    name: ?[]const u8 = null,
    code: usize = 0,
};

const IconEntry = struct {
    properties: IconProperties,
};

const SelectionJson = struct {
    icons: []IconEntry,
};

const PackageJson = struct {
    libraryIcons: ?[][]const u8 = null,
};

pub fn main() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const alloc = arena.allocator();

    var arg_it = try std.process.argsWithAllocator(alloc);
    defer arg_it.deinit();

    _ = arg_it.skip(); // skip executable name

    const target_dir = arg_it.next() orelse {
        std.debug.print("Usage: scanner <target_dir> <shipui_dir> <consumer_dir>\n", .{});
        std.process.exit(1);
    };
    const shipui_dir = arg_it.next() orelse {
        std.debug.print("Usage: scanner <target_dir> <shipui_dir> <consumer_dir>\n", .{});
        std.process.exit(1);
    };
    const consumer_dir = arg_it.next() orelse {
        std.debug.print("Usage: scanner <target_dir> <shipui_dir> <consumer_dir>\n", .{});
        std.process.exit(1);
    };

    var unique_icons = std.StringHashMap(void).init(alloc);

    // 1. Read libraryIcons from package.json
    try readPackageJson(alloc, shipui_dir, &unique_icons);

    // 2. Scan target_dir
    try scanDirectory(alloc, target_dir, &unique_icons);

    // 3. Output payload string
    try buildPayload(alloc, consumer_dir, &unique_icons);
}

fn readPackageJson(alloc: std.mem.Allocator, shipui_dir: []const u8, unique_icons: *std.StringHashMap(void)) !void {
    var cwd = std.fs.cwd();
    const pkg_path = try std.fs.path.join(alloc, &.{ shipui_dir, "package.json" });
    const contents = cwd.readFileAlloc(alloc, pkg_path, 10 * 1024 * 1024) catch return;
    const parsed = std.json.parseFromSlice(PackageJson, alloc, contents, .{ .ignore_unknown_fields = true }) catch return;
    defer parsed.deinit();

    if (parsed.value.libraryIcons) |icons| {
        for (icons) |icon| {
            try unique_icons.put(try alloc.dupe(u8, icon), {});
        }
    }
}

fn scanDirectory(alloc: std.mem.Allocator, target_dir: []const u8, unique_icons: *std.StringHashMap(void)) !void {
    var cwd = std.fs.cwd();
    var dir = cwd.openDir(target_dir, .{ .iterate = true }) catch return;
    defer dir.close();

    var walker = try dir.walk(alloc);
    defer walker.deinit();

    while (try walker.next()) |entry| {
        if (entry.kind != .file) continue;

        const is_html = std.mem.endsWith(u8, entry.path, ".html");
        const is_ts = std.mem.endsWith(u8, entry.path, ".ts");

        if (!is_html and !is_ts) continue;
        if (std.mem.indexOf(u8, entry.path, "node_modules") != null) continue;

        const contents = dir.readFileAlloc(alloc, entry.path, 100 * 1024 * 1024) catch continue;

        if (is_html) {
            try scanHtml(alloc, contents, unique_icons);
        }
        if (is_ts) {
            try scanTs(alloc, contents, unique_icons);
        }
    }
}

fn scanHtml(alloc: std.mem.Allocator, contents: []const u8, unique_icons: *std.StringHashMap(void)) !void {
    var pos: usize = 0;
    while (pos < contents.len) {
        const start_idx = std.mem.indexOfPos(u8, contents, pos, "<sh-icon") orelse break;
        pos = start_idx + "<sh-icon".len;

        const close_tag_idx = std.mem.indexOfPos(u8, contents, pos, ">") orelse break;
        const tag_body = contents[pos..close_tag_idx];
        const is_self_closing = std.mem.endsWith(u8, tag_body, "/");
        
        pos = close_tag_idx + 1;

        if (std.mem.indexOf(u8, tag_body, "icon=\"")) |icon_start_rel| {
            const attr_start = icon_start_rel + 6;
            if (std.mem.indexOf(u8, tag_body[attr_start..], "\"")) |quote_end_rel| {
                const icon_name = std.mem.trim(u8, tag_body[attr_start .. attr_start + quote_end_rel], " \t\r\n");
                if (icon_name.len > 0 and isValidIcon(icon_name)) {
                    try unique_icons.put(try alloc.dupe(u8, icon_name), {});
                }
            }
        } else if (std.mem.indexOf(u8, tag_body, "icon='")) |icon_start_rel| {
            const attr_start = icon_start_rel + 6;
            if (std.mem.indexOf(u8, tag_body[attr_start..], "'")) |quote_end_rel| {
                const icon_name = std.mem.trim(u8, tag_body[attr_start .. attr_start + quote_end_rel], " \t\r\n");
                if (icon_name.len > 0 and isValidIcon(icon_name)) {
                    try unique_icons.put(try alloc.dupe(u8, icon_name), {});
                }
            }
        }

        if (!is_self_closing) {
            const end_sh_icon = std.mem.indexOfPos(u8, contents, pos, "</sh-icon>") orelse break;
            const inner = contents[pos..end_sh_icon];
            pos = end_sh_icon + "</sh-icon>".len;

            const trimmed_inner = std.mem.trim(u8, inner, " \t\r\n");
            if (trimmed_inner.len > 0 and isValidIcon(trimmed_inner)) {
                try unique_icons.put(try alloc.dupe(u8, trimmed_inner), {});
            }
        }
    }
}

fn scanTs(alloc: std.mem.Allocator, contents: []const u8, unique_icons: *std.StringHashMap(void)) !void {
    var pos: usize = 0;
    while (pos < contents.len) {
        const start_idx = std.mem.indexOfPos(u8, contents, pos, "shicon:") orelse break;
        pos = start_idx + "shicon:".len;

        var end_idx: usize = pos;
        while (end_idx < contents.len and contents[end_idx] != '\'' and contents[end_idx] != '"') {
            end_idx += 1;
        }

        const icon_name = contents[pos..end_idx];
        if (icon_name.len > 0 and isValidIcon(icon_name)) {
            try unique_icons.put(try alloc.dupe(u8, icon_name), {});
        }
        pos = end_idx;
    }
}

fn isValidIcon(s: []const u8) bool {
    for (s) |c| {
        if ((c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '-') {
            continue;
        }
        return false;
    }
    return true;
}

const GroupArray = std.ArrayListUnmanaged([2][]const u8);

const GroupedIcons = struct {
    bold: GroupArray,
    thin: GroupArray,
    light: GroupArray,
    fill: GroupArray,
    regular: GroupArray,
    duotone: GroupArray,
    text: GroupArray,
    missing: std.ArrayListUnmanaged([]const u8),
};

const WriteContext = struct {
    list: *std.ArrayListUnmanaged(u8),
    alloc: std.mem.Allocator,
};

fn anyWriteFn(ctx: *const anyopaque, bytes: []const u8) anyerror!usize {
    const context: *const WriteContext = @ptrCast(@alignCast(ctx));
    try context.list.appendSlice(context.alloc, bytes);
    return bytes.len;
}

fn buildPayload(alloc: std.mem.Allocator, consumer_dir: []const u8, unique_icons: *std.StringHashMap(void)) !void {
    var cwd = std.fs.cwd();

    const variants = [_][]const u8{ "bold", "thin", "light", "fill", "regular", "duotone" };
    var glyph_maps = std.StringHashMap([2][]const u8).init(alloc);

    for (variants) |variant| {
        const sel_path = try std.fs.path.join(alloc, &.{ consumer_dir, "node_modules", "@phosphor-icons", "web", "src", variant, "selection.json" });
        const contents = cwd.readFileAlloc(alloc, sel_path, 10 * 1024 * 1024) catch continue;
        const parsed = std.json.parseFromSlice(SelectionJson, alloc, contents, .{ .ignore_unknown_fields = true }) catch continue;
        defer parsed.deinit();

        const is_duotone = std.mem.eql(u8, variant, "duotone");

        for (parsed.value.icons) |icon| {
            var hex_buf = try alloc.alloc(u8, 16);
            const hex_len = try std.fmt.bufPrint(hex_buf, "{x}", .{icon.properties.code});
            const valid_hex = hex_buf[0..hex_len.len];
            
            var unicode_buf = try alloc.alloc(u8, 16);
            const unicode_len = try std.fmt.bufPrint(unicode_buf, "U+{s}", .{valid_hex});
            const final_unicode = unicode_buf[0..unicode_len.len];

            // Convert character code directly into UTF-8 slice
            var char_buf = try alloc.alloc(u8, 4);
            const char_len = std.unicode.utf8Encode(@as(u21, @intCast(icon.properties.code)), char_buf) catch continue;
            const final_glyph = char_buf[0..char_len];

            var glyph_name: []const u8 = "";
            if (is_duotone) {
                if (icon.properties.name) |n| glyph_name = n;
            } else {
                if (icon.properties.ligatures) |l| glyph_name = l;
            }

            if (glyph_name.len == 0) continue;

            var val: [2][]const u8 = undefined;
            val[0] = try alloc.dupe(u8, final_glyph);
            val[1] = final_unicode;

            try glyph_maps.put(try alloc.dupe(u8, glyph_name), val);
        }
    }

    var grouped_icons = GroupedIcons{
        .bold = .{},
        .thin = .{},
        .light = .{},
        .fill = .{},
        .regular = .{},
        .duotone = .{},
        .text = .{},
        .missing = .{},
    };

    var it = unique_icons.keyIterator();
    while (it.next()) |key_ptr| {
        const icon = key_ptr.*;
        const bold = std.mem.endsWith(u8, icon, "-bold");
        const thin = std.mem.endsWith(u8, icon, "-thin");
        const light = std.mem.endsWith(u8, icon, "-light");
        const fill = std.mem.endsWith(u8, icon, "-fill");
        const duotone = std.mem.endsWith(u8, icon, "-duotone");
        const regular = !bold and !thin and !light and !fill and !duotone;

        if (glyph_maps.get(icon)) |glyph| {
            var tuple1: [2][]const u8 = undefined;
            tuple1[0] = icon;
            tuple1[1] = "";

            if (bold) {
                try grouped_icons.bold.append(alloc, tuple1);
                try grouped_icons.bold.append(alloc, glyph);
            } else if (thin) {
                try grouped_icons.thin.append(alloc, tuple1);
                try grouped_icons.thin.append(alloc, glyph);
            } else if (light) {
                try grouped_icons.light.append(alloc, tuple1);
                try grouped_icons.light.append(alloc, glyph);
            } else if (fill) {
                try grouped_icons.fill.append(alloc, tuple1);
                try grouped_icons.fill.append(alloc, glyph);
            } else if (duotone) {
                try grouped_icons.duotone.append(alloc, tuple1);
                try grouped_icons.duotone.append(alloc, glyph);
            } else if (regular) {
                try grouped_icons.regular.append(alloc, tuple1);
                try grouped_icons.regular.append(alloc, glyph);
            }
        } else {
            try grouped_icons.missing.append(alloc, icon);
        }
    }

    var string = std.ArrayListUnmanaged(u8){};
    var w = string.writer(alloc);

    try w.writeAll("{");
    
    inline for (.{ "bold", "thin", "light", "fill", "regular", "duotone" }, 0..) |variant, i| {
        if (i > 0) try w.writeAll(",");
        try w.print("\"{s}\":[", .{variant});
        
        var group_list: GroupArray = undefined;
        if (std.mem.eql(u8, variant, "bold")) group_list = grouped_icons.bold;
        if (std.mem.eql(u8, variant, "thin")) group_list = grouped_icons.thin;
        if (std.mem.eql(u8, variant, "light")) group_list = grouped_icons.light;
        if (std.mem.eql(u8, variant, "fill")) group_list = grouped_icons.fill;
        if (std.mem.eql(u8, variant, "regular")) group_list = grouped_icons.regular;
        if (std.mem.eql(u8, variant, "duotone")) group_list = grouped_icons.duotone;

        for (group_list.items, 0..) |item, j| {
            if (j > 0) try w.writeAll(",");
            try w.print("[\"{s}\",\"{s}\"]", .{ item[0], item[1] });
        }
        try w.writeAll("]");
    }

    try w.writeAll(",\"missing\":[");
    for (grouped_icons.missing.items, 0..) |item, i| {
        if (i > 0) try w.writeAll(",");
        try w.print("\"{s}\"", .{item});
    }
    try w.writeAll("]}");

    var stdout = std.fs.File.stdout();
    try stdout.writeAll(string.items);
}

import { describe, it, expect } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SHIP_CONFIG } from '@ship-ui/core';
import { ShipLayoutEmptyState } from './ship-empty-state';
import { ShipLayoutPage } from './ship-page';
import { ShipLayoutSection } from './ship-section';
import { ShipLayoutSetting } from './ship-setting';
import { ShipLayoutStat } from './ship-stat';
import { ShipLayoutStatRing } from './ship-stat-ring';
import { ShipLayoutStatTrend } from './ship-stat-trend';
import { ShipLayoutStatGoal } from './ship-stat-goal';
import { ShipLayoutRanking, ShipLayoutRankingItem } from './ship-ranking';
import { ShipLayoutAchievement } from './ship-achievement';
import { ShipLayoutInbox, ShipLayoutInboxItem } from './ship-inbox';
import { ShipLayoutTableView } from './ship-table-view';
import { ShipLayoutDetail, ShipLayoutDetails } from './ship-details';
import { ShipLayoutTimeline, ShipLayoutTimelineItem } from './ship-timeline';
import { ShipLayoutToolbar } from './ship-toolbar';

@Component({
  template: `
    <sh-lo-page size="small" class="custom sticky">
      <nav>crumbs</nav>
      <h1>Title</h1>
      <p>Description</p>
      <button actions>Act</button>
      <div class="content">content</div>
      <div aside>aside</div>
    </sh-lo-page>
    <sh-lo-section variant="type-c"><p>body only</p></sh-lo-section>
    <sh-lo-setting>
      <label>Label</label>
      <p>Help</p>
      <input />
    </sh-lo-setting>
    <sh-lo-empty-state>
      <h3>Nothing</h3>
      <button>Add</button>
    </sh-lo-empty-state>
  `,
  imports: [ShipLayoutPage, ShipLayoutSection, ShipLayoutSetting, ShipLayoutEmptyState],
})
class TestHostComponent {}

function setup() {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  return (selector: string) => el.querySelector(selector) as HTMLElement;
}

describe('ship-layout', () => {
  it('stamps the page size next to consumer classes', () => {
    const q = setup();
    const page = q('sh-lo-page');
    expect(page.classList).toContain('small');
    expect(page.classList).toContain('custom');
    expect(page.classList).toContain('sticky');
  });

  it('routes page slots', () => {
    const q = setup();
    expect(q('sh-lo-page > .head > .nav > nav').textContent).toBe('crumbs');
    expect(q('sh-lo-page .title > .text > h1').textContent).toBe('Title');
    expect(q('sh-lo-page .title > .text > p').textContent).toBe('Description');
    expect(q('sh-lo-page .title > .actions > button').textContent).toBe('Act');
    expect(q('sh-lo-page > .body > .main > .content').textContent).toBe('content');
    expect(q('sh-lo-page > .body > .aside > [aside]').textContent).toBe('aside');
  });

  it('treats a plain <p> in a section as description', () => {
    const q = setup();
    expect(q('sh-lo-section .head .text > p').textContent).toBe('body only');
  });

  it('stamps variants and falls back to the ShipConfig default', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SHIP_CONFIG,
          useValue: { layoutSetting: { variant: 'type-b' }, layoutEmptyState: { variant: 'type-b' } },
        },
      ],
    });
    const q = setup();
    expect(q('sh-lo-page').classList).toContain('base');
    expect(q('sh-lo-section').classList).toContain('type-c');
    expect(q('sh-lo-setting').classList).toContain('type-b');
    expect(q('sh-lo-empty-state').classList).toContain('type-b');
  });

  it('routes setting and empty-state slots', () => {
    const q = setup();
    expect(q('sh-lo-setting > .text > label').textContent).toBe('Label');
    expect(q('sh-lo-setting > .text > p').textContent).toBe('Help');
    expect(q('sh-lo-setting > .control > input')).toBeTruthy();
    expect(q('sh-lo-empty-state > .text > h3').textContent).toBe('Nothing');
    expect(q('sh-lo-empty-state > .actions > button').textContent).toBe('Add');
  });
});

@Component({
  template: `
    <sh-lo-stat variant="type-b">
      <p>Visitors</p>
      <h3>48k</h3>
      <span delta>+1%</span>
      <div chart>chart</div>
    </sh-lo-stat>
    <sh-lo-details>
      <h3>Details</h3>
      <sh-lo-detail>
        <dt>Owner</dt>
        Alex
      </sh-lo-detail>
    </sh-lo-details>
    <sh-lo-timeline variant="type-c">
      <sh-lo-timeline-item>
        <b>Deployed</b>
        <time>1h</time>
        <p>v2</p>
      </sh-lo-timeline-item>
    </sh-lo-timeline>
    <sh-lo-toolbar>
      <button>Archive</button>
      <span end>1–50</span>
    </sh-lo-toolbar>
  `,
  imports: [
    ShipLayoutStat,
    ShipLayoutDetails,
    ShipLayoutDetail,
    ShipLayoutTimeline,
    ShipLayoutTimelineItem,
    ShipLayoutToolbar,
  ],
})
class MoreHostComponent {}

describe('ship-layout (stat, details, timeline, toolbar)', () => {
  it('routes slots and stamps variants', () => {
    const fixture = TestBed.createComponent(MoreHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const q = (s: string) => el.querySelector(s) as HTMLElement;

    expect(q('sh-lo-stat').classList).toContain('type-b');
    expect(q('sh-lo-stat > .text > p').textContent).toBe('Visitors');
    expect(q('sh-lo-stat .value > h3').textContent).toBe('48k');
    expect(q('sh-lo-stat .value > [delta]').textContent).toBe('+1%');
    expect(q('sh-lo-stat > .chart > [chart]')).toBeTruthy();

    expect(q('sh-lo-details').classList).toContain('base');
    expect(q('sh-lo-details > .head > h3').textContent).toBe('Details');
    expect(q('sh-lo-detail > .term > dt').textContent).toBe('Owner');
    expect(q('sh-lo-detail > .value').textContent?.trim()).toBe('Alex');

    expect(q('sh-lo-timeline').classList).toContain('type-c');
    expect(q('sh-lo-timeline-item .head > b').textContent).toBe('Deployed');
    expect(q('sh-lo-timeline-item .head > time').textContent).toBe('1h');
    expect(q('sh-lo-timeline-item > .content > p').textContent).toBe('v2');

    expect(q('sh-lo-toolbar').getAttribute('role')).toBe('toolbar');
    expect(q('sh-lo-toolbar > button').textContent).toBe('Archive');
    expect(q('sh-lo-toolbar > .end > span').textContent).toBe('1–50');
  });
});

@Component({
  template: `
    <sh-lo-stat-trend color="success">
      <p>Revenue</p>
      <h3>$32.9k</h3>
      <span delta>+12%</span>
      <small>Up from $29.4k</small>
      <div chart>chart</div>
    </sh-lo-stat-trend>
    <sh-lo-stat-goal [value]="204" [max]="300" label="Sales goal" variant="type-b">
      <p>Sales goal</p>
      <h3>$204k</h3>
      <span target>$300k</span>
    </sh-lo-stat-goal>
    <sh-lo-stat-ring [value]="30" [max]="120" color="warn" variant="type-b">
      <p>Storage</p>
    </sh-lo-stat-ring>
    <sh-lo-stat-ring [value]="5" [max]="10"><h3>5h</h3></sh-lo-stat-ring>
    <sh-lo-ranking [max]="200" variant="type-b">
      <h3>Top</h3>
      <sh-lo-ranking-item [value]="50">
        a
        <span detail>50</span>
      </sh-lo-ranking-item>
      <sh-lo-ranking-item [value]="400">b</sh-lo-ranking-item>
    </sh-lo-ranking>
  `,
  imports: [ShipLayoutStatTrend, ShipLayoutStatGoal, ShipLayoutStatRing, ShipLayoutRanking, ShipLayoutRankingItem],
})
class StatsHostComponent {}

describe('ship-layout (stat-trend, stat-goal, stat-ring, ranking)', () => {
  it('stamps colors, computes percentages and routes slots', () => {
    const fixture = TestBed.createComponent(StatsHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const q = (s: string) => el.querySelector(s) as HTMLElement;
    const qa = (s: string) => Array.from(el.querySelectorAll(s)) as HTMLElement[];

    const trend = q('sh-lo-stat-trend');
    expect(trend.classList).toContain('success');
    expect(q('sh-lo-stat-trend > .head > p').textContent).toBe('Revenue');
    expect(q('sh-lo-stat-trend > .value > h3').textContent).toBe('$32.9k');
    expect(q('sh-lo-stat-trend > .value > [delta]').textContent).toBe('+12%');
    expect(q('sh-lo-stat-trend > .footer > small').textContent).toBe('Up from $29.4k');
    expect(q('sh-lo-stat-trend > .chart > [chart]')).toBeTruthy();

    const goal = q('sh-lo-stat-goal');
    expect(goal.classList).toContain('type-b');
    expect(q('sh-lo-stat-goal > .head > .pct')).toBeNull();
    expect(q('sh-lo-stat-goal > .value > .target > [target]').textContent).toBe('$300k');
    const bar = q('sh-lo-stat-goal > .bar');
    expect(bar.getAttribute('aria-valuenow')).toBe('68');
    expect(bar.getAttribute('aria-label')).toBe('Sales goal');
    // type-b: 68% rounds to 7 of 10 lit segments.
    expect(bar.querySelectorAll('i').length).toBe(10);
    expect(bar.querySelectorAll('i.on').length).toBe(7);

    const rings = qa('sh-lo-stat-ring');
    expect(rings[0].classList).toContain('warn');
    expect(rings[0].classList).toContain('type-b');
    expect(rings[0].querySelector('.ring')?.getAttribute('style')).toContain('--ring-pct: 25');
    // No `label`: the ring is plain content, so the slotted h3/p stay readable.
    expect(rings[0].querySelector('.ring')?.getAttribute('role')).toBeNull();
    expect(rings[0].querySelector('.ring')?.getAttribute('aria-label')).toBeNull();
    expect(rings[0].querySelector('.center > .pct')?.textContent).toBe('25%');
    expect(rings[1].querySelector('.center > h3')?.textContent).toBe('5h');

    const ranking = q('sh-lo-ranking');
    expect(ranking.classList).toContain('type-b');
    // The list role sits on the items wrapper so the heading row is not a list child.
    expect(ranking.getAttribute('role')).toBeNull();
    expect(q('sh-lo-ranking > .items').getAttribute('role')).toBe('list');
    expect(q('sh-lo-ranking > .head > h3').textContent).toBe('Top');
    const items = qa('sh-lo-ranking-item');
    expect(items[0].getAttribute('style')).toContain('--bar-pct: 25');
    expect(items[0].querySelector('.row > .detail > [detail]')?.textContent).toBe('50');
    // Values above max clamp to a full bar.
    expect(items[1].getAttribute('style')).toContain('--bar-pct: 100');
  });
});

@Component({
  template: `
    <sh-lo-stat variant="type-d" color="warn">
      <p>Revenue</p>
      <h3>$1</h3>
    </sh-lo-stat>
  `,
  imports: [ShipLayoutStat],
})
class StatTypeDHostComponent {}

describe('ship-layout (stat type-d)', () => {
  it('stamps the variant and color', () => {
    const fixture = TestBed.createComponent(StatTypeDHostComponent);
    fixture.detectChanges();
    const stat = (fixture.nativeElement as HTMLElement).querySelector('sh-lo-stat') as HTMLElement;
    expect(stat.classList).toContain('type-d');
    expect(stat.classList).toContain('warn');
  });
});

@Component({
  template: `
    <sh-lo-achievement color="accent" variant="type-b">
      <img src="x.svg" alt="" />
      <h3>First deploy</h3>
      <span tag>Rare</span>
      <p>Shipped it.</p>
      <small>Sep 12</small>
    </sh-lo-achievement>
    <sh-lo-achievement locked>
      <span media>M</span>
      <h3>Locked</h3>
    </sh-lo-achievement>
    <sh-lo-achievement [dynamic]="true" style="--achievement-c: rgb(1, 2, 3)">
      <h3>Dyn</h3>
    </sh-lo-achievement>
  `,
  imports: [ShipLayoutAchievement],
})
class AchievementHostComponent {}

describe('ship-layout (achievement)', () => {
  it('routes slots, stamps color/variant and renders the locked state', () => {
    const fixture = TestBed.createComponent(AchievementHostComponent);
    fixture.detectChanges();
    const [earned, locked, dyn] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('sh-lo-achievement')
    ) as HTMLElement[];

    expect(earned.classList).toContain('accent');
    expect(earned.classList).toContain('type-b');
    expect(earned.classList).not.toContain('locked');
    expect(earned.querySelector('.medallion > img')).toBeTruthy();
    expect(earned.querySelector('.text > .title > h3')?.textContent).toBe('First deploy');
    expect(earned.querySelector('.text > .title > [tag]')?.textContent).toBe('Rare');
    expect(earned.querySelector('.text > p')?.textContent).toBe('Shipped it.');
    expect(earned.querySelector('.text > .meta > small')?.textContent).toBe('Sep 12');
    expect(earned.querySelector('.medallion > .lock')).toBeNull();

    expect(locked.classList).toContain('locked');
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    expect(locked.querySelector('.medallion > [media]')?.textContent).toBe('M');
    expect(locked.querySelector('.medallion > .lock')).toBeTruthy();

    expect(dyn.classList).toContain('dynamic');
    expect(dyn.style.getPropertyValue('--achievement-c')).toBe('rgb(1, 2, 3)');
  });
});

@Component({
  template: `
    <sh-lo-inbox variant="type-b">
      <nav folders><a class="active">Inbox</a></nav>
      <div toolbar>bar</div>
      <sh-lo-inbox-item unread selected>
        <span from>Sofia</span>
        <h4>Subject</h4>
        <p>Snippet</p>
        <time>10:42</time>
      </sh-lo-inbox-item>
      <sh-lo-inbox-item><span from>Mads</span></sh-lo-inbox-item>
      <article reader>Reading</article>
    </sh-lo-inbox>
    <sh-lo-table-view variant="type-c">
      <h2>Customers</h2>
      <p>All of them</p>
      <button actions>Add</button>
      <div filters>search</div>
      <div toolbar>bulk</div>
      <table>
        <tr><td>row</td></tr>
      </table>
      <span footer>1 of 1</span>
    </sh-lo-table-view>
  `,
  imports: [ShipLayoutInbox, ShipLayoutInboxItem, ShipLayoutTableView],
})
class FullPageHostComponent {}

describe('ship-layout (inbox, table-view)', () => {
  it('routes the inbox and table-view slots', () => {
    const fixture = TestBed.createComponent(FullPageHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const q = (s: string) => el.querySelector(s) as HTMLElement;

    const inbox = q('sh-lo-inbox');
    expect(inbox.classList).toContain('type-b');
    expect(q('sh-lo-inbox > .folders > [folders] > a').textContent).toBe('Inbox');
    expect(q('sh-lo-inbox > .list > [toolbar]').textContent).toBe('bar');
    expect(q('sh-lo-inbox > .list > .items').getAttribute('role')).toBe('list');
    expect(q('sh-lo-inbox > .reader > [reader]').textContent).toBe('Reading');

    const [first, second] = Array.from(el.querySelectorAll('sh-lo-inbox-item')) as HTMLElement[];
    expect(first.parentElement?.classList).toContain('items');
    expect(first.getAttribute('role')).toBe('listitem');
    expect(first.classList).toContain('unread');
    expect(first.classList).toContain('selected');
    expect(first.querySelector('.from > [from]')?.textContent).toBe('Sofia');
    expect(first.querySelector('.message > h4')?.textContent).toBe('Subject');
    expect(first.querySelector('.message > p')?.textContent).toBe('Snippet');
    expect(first.querySelector('.time > time')?.textContent).toBe('10:42');
    expect(second.classList).not.toContain('unread');

    expect(q('sh-lo-table-view').classList).toContain('type-c');
    expect(q('sh-lo-table-view > .head > .text > h2').textContent).toBe('Customers');
    expect(q('sh-lo-table-view > .head > .actions > button').textContent).toBe('Add');
    expect(q('sh-lo-table-view > .filters > [filters]').textContent).toBe('search');
    expect(q('sh-lo-table-view > .surface > [toolbar]').textContent).toBe('bulk');
    expect(q('sh-lo-table-view > .surface > .table > table')).toBeTruthy();
    expect(q('sh-lo-table-view > .surface > .footer > [footer]').textContent).toBe('1 of 1');
  });
});

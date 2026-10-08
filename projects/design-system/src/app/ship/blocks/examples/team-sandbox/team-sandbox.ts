import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockTeamVariant } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipBlockMember, ShipBlockTeam } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

const GITHUB = { icon: 'github-logo', label: 'GitHub' };
const LINKEDIN = { icon: 'linkedin-logo', label: 'LinkedIn' };
const TWITTER = { icon: 'twitter-logo', label: 'X' };

// subset: 'shicon:github-logo' 'shicon:linkedin-logo' 'shicon:twitter-logo'
@Component({
  selector: 'app-team-sandbox',
  imports: [ShipBlockTeam, ShipBlockMember, ShipAvatar, ShipButton, ShipIcon],
  templateUrl: './team-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSandbox {
  variant = input<ShipBlockTeamVariant>('');

  members = [
    { name: 'Maya Lindqvist', role: 'Founder & CEO', bio: 'Ran design systems at two scale-ups before starting ShipUI.', social: [LINKEDIN, TWITTER] },
    { name: 'Jonas Okafor', role: 'Head of Engineering', bio: 'Keeps the bundle small and the tests green.', social: [GITHUB, LINKEDIN] },
    { name: 'Priya Raman', role: 'Design Lead', bio: 'Owns the tokens, the type scale and every pixel in between.', social: [TWITTER, LINKEDIN] },
    { name: 'Lucas Moreau', role: 'Frontend Engineer', bio: 'Builds the editor, the spreadsheet and anything with a caret.', social: [GITHUB] },
    { name: 'Hana Sato', role: 'Accessibility Engineer', bio: 'Tests every component with a screen reader before it ships.', social: [GITHUB, TWITTER] },
    { name: 'Tomás Rivera', role: 'Developer Advocate', bio: 'Writes the docs, the examples and most of the changelog.', social: [TWITTER, GITHUB] },
    { name: 'Elin Berg', role: 'Product Designer', bio: 'Turns customer feedback into the next set of blocks.', social: [LINKEDIN] },
    { name: 'Kwame Mensah', role: 'Customer Success', bio: 'Helps teams migrate and answers the hard questions.', social: [LINKEDIN, TWITTER] },
  ];
}

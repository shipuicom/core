import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { Coordinates, ShipBlueprint, TEST_NODES } from '@ship-ui/core/ship-blueprint';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-blueprints',
  imports: [ShipTabs, ApiReference, Highlight, PropertyViewer, ShipBlueprint, ShipToggle, ShipButton, ShipIcon],
  templateUrl: './blueprints.html',
  styleUrl: './blueprints.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Blueprints {
  activeTab = signal('overview');
  showAsDots = signal(false);

  basicCode = `<sh-blueprint [autoLayout]="true" [(nodes)]="nodes" />`;

  nodes = signal(TEST_NODES);
  blueprint = viewChild.required(ShipBlueprint);

  onChange(event: any) {
    console.log(event);
  }

  lastCoordinates = [null, null] as Coordinates | [null, null];

  addNewNode() {
    const blueprint = this.blueprint();
    const newCoordinates = blueprint.getNewNodeCoordinates(false);

    // Generate a new node and node id
    // const newCoordinates = [
    //   this.lastCoordinates[0] === null ? 20 : this.lastCoordinates[0] + 200,
    //   this.lastCoordinates[1] === null ? 200 : this.lastCoordinates[1],
    // ] as Coordinates;

    const { inputs, outputs } = this.#generatePorts();
    const newNode = {
      id: Math.random().toString(36).substring(2, 15),
      coordinates: newCoordinates,
      inputs: inputs,
      outputs: outputs,
      connections: [],
    };

    this.lastCoordinates = newCoordinates;

    this.nodes.update((nodes) => [...nodes, newNode]);
  }

  #generatePorts() {
    const inputs = [];
    const outputs = [];
    const randomNumberInputs = Math.floor(Math.random() * 5);
    const randomNumberOutputs = Math.floor(Math.random() * 5);

    for (let i = 0; i < randomNumberInputs; i++) {
      inputs.push({
        id: Math.random().toString(36).substring(2, 15),
        name: `Input ${i + 1}`,
      });
    }

    for (let i = 0; i < randomNumberOutputs; i++) {
      outputs.push({
        id: Math.random().toString(36).substring(2, 15),
        name: `Output ${i + 1}`,
      });
    }

    return { inputs, outputs };
  }
}

import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { Coordinates, ShipBlueprint, ShipButton, ShipIcon, ShipToggle, TEST_NODES } from 'ship-ui';

@Component({
  selector: 'app-blueprints',
  imports: [ShipBlueprint, ShipToggle, ShipButton, ShipIcon],
  templateUrl: './blueprints.html',
  styleUrl: './blueprints.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlueprintsComponent {
  showAsDots = signal(false);

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

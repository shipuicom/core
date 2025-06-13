import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';

@Component({
  selector: '[spk-button]',
  imports: [],
  template: `
    <ng-content></ng-content>
    @if (glass()) {
      <svg width="0" height="0">
        <filter id="edge-refraction-filter" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />

          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />

          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="2"
            specularExponent="100"
            lighting-color="white"
            result="specLight">
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>

          <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />

          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="120" result="displaced_edges" />

          <feGaussianBlur in="displaced_edges" stdDeviation="1" />
        </filter>
        <!-- <filter id="edge-refraction-filter" color-interpolation-filters="sRGB">
          <feMorphology in="SourceAlpha" operator="erode" radius="12" result="eroded_alpha" />
          <feGaussianBlur in="eroded_alpha" stdDeviation="15000" result="blurred_core" />
          <feComposite in="SourceAlpha" in2="blurred_core" operator="out" result="edge_glow" />
          <feComposite in="turbulence" in2="edge_glow" operator="in" result="masked_turbulence" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="masked_turbulence"
            scale="25"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced_edges" />

          <feGaussianBlur in="displaced_edges" stdDeviation="3" />
        </filter> -->
      </svg>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleButtonComponent {
  #el = inject(ElementRef);

  glass = signal(this.#el.nativeElement.classList.contains('glass'));
}

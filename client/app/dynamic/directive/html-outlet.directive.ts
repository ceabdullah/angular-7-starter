import {Compiler, Component, ComponentFactory, ComponentRef, Directive, Input, ModuleWithComponentFactories, NgModule, OnChanges, OnDestroy, ReflectiveInjector, ViewContainerRef} from '@angular/core';

import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {SharedModule} from '../../shared/shared.module';


export function createComponentFactory(compiler: Compiler, metadata: Component): Promise<ComponentFactory<any>> {
  const cmpClass = class DynamicComponent {
  };
  const decoratedCmp = Component(metadata)(cmpClass);

  @NgModule(<NgModule>{imports: [CommonModule, RouterModule, SharedModule], declarations: [decoratedCmp]})
  class DynamicHtmlModule {
  }

  return compiler.compileModuleAndAllComponentsAsync(DynamicHtmlModule)
    .then((moduleWithComponentFactory: ModuleWithComponentFactories<any>) => {
      return moduleWithComponentFactory.componentFactories.find(x => x.componentType === decoratedCmp);
    });
}

@Directive({
  selector: '[appHtmlOutlet]',
})

export class AppHtmlOutletDirective implements OnDestroy, OnChanges {
  @Input() html: string;
  cmpRef: ComponentRef<any>;

  constructor(private vcRef: ViewContainerRef, private compiler: Compiler) {
  }

  ngOnChanges() {
    const html = this.html;
    if (!html) {
      return;
    }

    if (this.cmpRef) {
      this.cmpRef.destroy();
    }

    const compMetadata = new Component({
      selector: 'dynamic-html',
      template: this.html,
    });

    createComponentFactory(this.compiler, compMetadata)
      .then(factory => {
        const injector = ReflectiveInjector.fromResolvedProviders([], this.vcRef.parentInjector);
        this.cmpRef = this.vcRef.createComponent(factory, 0, injector, []);
      });
  }

  ngOnDestroy() {
    if (this.cmpRef) {
      this.cmpRef.destroy();
    }
  }
}

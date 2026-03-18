/**
 * Component Serializer (Rekomendasi #12)
 * Serialize komponen & referensi aset untuk UGC
 */

import { Component } from './Component';

export interface SerializedComponent {
  type: string;
  name: string;
  data: any;
}

export interface SerializableComponent extends Component {
  serialize(): any;
  deserialize(data: any): void;
}

export class ComponentSerializer {
  private static componentRegistry: Map<string, new (...args: any[]) => Component> = new Map();
  
  public static registerComponent(type: string, componentClass: new (...args: any[]) => Component): void {
    if (this.componentRegistry.has(type)) {
      console.warn(`Component type ${type} already registered, overwriting...`);
    }
    this.componentRegistry.set(type, componentClass);
  }
  
  public static serialize(component: Component): SerializedComponent | null {
    if (!this.isSerializable(component)) {
      console.warn(`Component ${component.name} is not serializable`);
      return null;
    }
    
    const serializable = component as SerializableComponent;
    return {
      type: component.constructor.name,
      name: component.name,
      data: serializable.serialize(),
    };
  }
  
  public static deserialize(serialized: SerializedComponent): Component | null {
    const ComponentClass = this.componentRegistry.get(serialized.type);
    
    if (!ComponentClass) {
      console.error(`Component type ${serialized.type} not registered`);
      return null;
    }
    
    const component = new ComponentClass();
    component.name = serialized.name;
    
    if (this.isSerializable(component)) {
      (component as SerializableComponent).deserialize(serialized.data);
    }
    
    return component;
  }
  
  private static isSerializable(component: Component): component is SerializableComponent {
    return 'serialize' in component && 'deserialize' in component;
  }
  
  public static serializeComponents(components: Component[]): SerializedComponent[] {
    return components
      .map(c => this.serialize(c))
      .filter((c): c is SerializedComponent => c !== null);
  }
  
  public static deserializeComponents(serialized: SerializedComponent[]): Component[] {
    return serialized
      .map(s => this.deserialize(s))
      .filter((c): c is Component => c !== null);
  }
}

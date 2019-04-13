import { observable, computed, action } from 'mobx';

export default class State {  
  @observable windowWidth = window.innerWidth;
  @observable windowHeight = window.innerHeight;
  @action.bound
  updateWindowSize(width, height) {
    this.windowWidth = width;
    this.renderCanvas.width = width;    
    this.windowHeight = height;
    this.renderCanvas.height = height;    
    this.gpu.viewport(0, 0, width, height);    
  }
  @observable renderCanvas = null;
  @action.bound
  updateRenderCanvas(element) {
    this.renderCanvas = element;
  }
  @observable gpu = null;
  @action.bound
  updateGpu(context) {
    this.gpu = context;
  }  
}

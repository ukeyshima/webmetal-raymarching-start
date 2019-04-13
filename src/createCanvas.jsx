import React from 'react';
import { inject, observer } from 'mobx-react';
import shader from "./shader.metal";

const position = new Float32Array([
      -1, -1, 0, 1,
      1, -1, 0, 1,
      1, 1, 0, 1 ,
      -1, -1, 0, 1,
      -1, 1, 0, 1,
      1, 1, 0, 1
  ]);  


const setUpMetal=gpu=>{  
  const commandQueue = gpu.createCommandQueue();  
  const renderPassDescriptor = new WebMetalRenderPassDescriptor();  
  renderPassDescriptor.colorAttachments[0].loadAction = gpu.LoadActionClear;
  renderPassDescriptor.colorAttachments[0].storeAction = gpu.StoreActionStore;  
  renderPassDescriptor.colorAttachments[0].clearColor = [1.0, 0.0, 0.0, 1.0];
  return {
    commandQueue:commandQueue,
    renderPassDescriptor:renderPassDescriptor
  }
}

const makePipeline=(gpu,shader)=>{
  const library=gpu.createLibrary(shader);  
  const vs=library.functionWithName("vertexShader");  
  const fs=library.functionWithName("fragmentShader");  
  const pipelineDescriptor = new WebMetalRenderPipelineDescriptor();  
  pipelineDescriptor.vertexFunction = vs;
  pipelineDescriptor.fragmentFunction = fs;
  pipelineDescriptor.colorAttachments[0].pixelFormat = gpu.PixelFormatBGRA8Unorm;
 
  const renderPipelineState = gpu.createRenderPipelineState(pipelineDescriptor);
  return renderPipelineState;
}

const webGPUStart = (gpu,shader,canvas) => {
  const { commandQueue, renderPassDescriptor } = setUpMetal(gpu);  
  const renderPipelineState = makePipeline(gpu,shader);  
  const positionBuffer = gpu.createBuffer(position); 
  const startTime=new Date().getTime();
  const uniform = new Float32Array([canvas.width, canvas.height,startTime]);  
  const uniformBuffer = gpu.createBuffer(uniform);  

  const render = () => {   
   const time = (new Date().getTime()-startTime)*0.001;   
   const bufferData = new Float32Array(uniformBuffer.contents);
   bufferData[2] = time;   
   
   const drawable = gpu.nextDrawable();
   renderPassDescriptor.colorAttachments[0].texture = drawable.texture;   
   const cBuffer = commandQueue.createCommandBuffer();   
   const encoder = cBuffer.createRenderCommandEncoderWithDescriptor(renderPassDescriptor);
   encoder.setRenderPipelineState(renderPipelineState);   
   encoder.setVertexBuffer(positionBuffer, 0, 0);    
   encoder.setFragmentBuffer(uniformBuffer, 0, 0);

   encoder.drawPrimitives(gpu.PrimitiveTypeTriangle, 0, 6);  
   
   encoder.endEncoding(); 
   cBuffer.presentDrawable(drawable);   
   cBuffer.commit();
 }  
  return { render: render};
};

@inject(({ state }) => ({
  windowWidth: state.windowWidth,
  windowHeight: state.windowHeight,
  updateWindowSize: state.updateWindowSize,
  renderCanvas: state.renderCanvas,
  gpu: state.gpu,
  updateRenderCanvas: state.updateRenderCanvas,
  updateGpu: state.updateGpu  
}))
@observer
export default class CreateCanvas extends React.Component {
  componentDidMount() {
    if (!('WebGPURenderingContext' in window)) {      
      console.log("not supported webgpu")
      return;
    }    
    const renderCanvas = this.renderCanvas;
    renderCanvas.width = this.props.windowWidth;
    renderCanvas.height = this.props.windowHeight;        
    const gpu = renderCanvas.getContext('webmetal');      
    console.log("Hello! WebMetal!")  
    console.log(gpu);    
    this.props.updateRenderCanvas(renderCanvas);
    this.props.updateGpu(gpu);    
    this.updateGpu(gpu,renderCanvas);    
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.requestId);    
    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = e => {
    const width = e.target.innerWidth;
    const height = e.target.innerHeight;
    this.props.updateWindowSize(width, height);
  };
  updateGpu = (gpu,canvas) => {    
    const { render } = webGPUStart(gpu,shader,canvas);    
    const renderLoop = () => {
      render();
      this.requestId = requestAnimationFrame(renderLoop);
    };
    renderLoop();    
  };
  render() {
    return (      
        <canvas
          style={{
            width: this.props.windowWidth,
            height: this.props.windowHeight
          }}
          ref={e => {
            this.renderCanvas = e;
          }}
        />      
    );
  }
}

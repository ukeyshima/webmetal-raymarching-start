#include <metal_stdlib>

using namespace metal;

struct Vert {    
    float4 position [[position]];        
};

struct Uniform {
    float2 resolution;    
    float time;
};

vertex Vert vertexShader(device Vert *vertices [[buffer(0)]],uint vid [[vertex_id]]){
    return vertices[vid];
}

float sphereDistFunc(float3 p, float r) { 
    return length(p) - r; 
}

float distFunc(float3 p) {    
    return sphereDistFunc(p, 1.0); 
}

float3 getNormal(float3 p) {
  float d = 0.001;
  return normalize(
      float3(distFunc(p + float3(d, 0.0, 0.0)) - distFunc(p + float3(-d, 0.0, 0.0)),
           distFunc(p + float3(0.0, d, 0.0)) - distFunc(p + float3(0.0, -d, 0.0)),
           distFunc(p + float3(0.0, 0.0, d)) - distFunc(p + float3(0.0, 0.0, -d)))
           );
}

float3 rayMarching(float2 p) {
  float3 cPos = float3(0.0, 0.0, -5.0);
  float3 cDir = float3(0.0, 0.0, 1.0);
  float3 cUp = float3(0.0, 1.0, 0.0);
  float3 cSide = float3(1.0,0.0,0.0);
  float depth = 1.0;  
  float3 ray = normalize(cSide * p.x + cUp * p.y + cDir * depth);
  float3 lPos = float3(10.0, 10.0, -10.0);  
  float3 rPos = cPos;
  float rLen = 0.0;
  float maxDist = 30.0;
  float3 sphereColor = float3(0.8, 0.2, 0.6);
  float3 color = float3(0.1);
  for (float i = 0.0; i < 60.0; i++) {
    float distance = distFunc(rPos);
    if (abs(distance) < 0.01) {
      float3 normal = getNormal(rPos);
      float3 lVec = normalize(lPos - rPos);      
      float diffuse = clamp(dot(normal, lVec), 0.0, 1.0) + 0.1;
      float specular = pow(clamp(dot(normal, lVec), 0.0, 1.0), 50.0);
      color = sphereColor * diffuse + specular;
      break;
    }
    rLen += distance;
    if (rLen > maxDist) {
      break;
    }
    rPos = cPos + rLen * ray;
  }
  return color;
}

fragment float4 fragmentShader(Vert vertexIn [[stage_in]],constant Uniform *uniforms [[buffer(0)]]) {
    float2 r = uniforms->resolution.xy;    
    float t = uniforms->time;    
    float2 p = (vertexIn.position.xy * 2.0 - r) / min(r.x, r.y);             
    p.y *= -1.0;    
    float3 color = rayMarching(p);
    return float4(color,1.0);
}
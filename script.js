import {Vector2, Vector3, Object3D, Color, MathUtils} from "https://unpkg.com/three@0.156.1/build/three.module.js";
import * as TWEEN from "https://unpkg.com/three@0.156.1/examples/jsm/libs/tween.module.js";

console.clear();

class Frame {
  constructor(size, width, radius){
    this.size = size;
    this.width = width;
    this.radius = radius;
    this.fill = "gray";
    this.stroke = "black";
    this.lineWidth = 4;
    
    this.mediators = {
      v: new Vector2()
    }
  }
  
  draw(ctx){
    let size = this.size;
    let v = this.mediators.v;
    
    ctx.save();
    ctx.fillStyle = this.fill;
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
      ctx.moveTo(size.x * 0.5, size.y * 0.5);
      ctx.lineTo(size.x * -0.5, size.y * 0.5);
      ctx.lineTo(size.x * -0.5, size.y * -0.5);
      ctx.lineTo(size.x * 0.5, size.y * -0.5);
      ctx.closePath();
    
    v.copy(this.size).multiplyScalar(0.5).subScalar(this.width + this.radius);
    let quart = Math.PI * 0.5;
      ctx.moveTo(v.x + this.radius, -v.y);
      ctx.arc(v.x, -v.y, this.radius, quart * 0, quart * -1, true);
      ctx.arc(-v.x, -v.y, this.radius, quart * -1, quart * -2, true);
      ctx.arc(-v.x, v.y, this.radius, quart * -2, quart * -3, true);
      ctx.arc(v.x, v.y, this.radius, quart * -3, quart * -4, true);
      ctx.closePath();
    
    
    ctx.fill();
    //ctx.stroke();
    ctx.restore();
  }
}

class Frames {
  constructor(){
    this.frames = [];
    this.bgColor = "white";
  }
  draw(ctx, palette){
    
    let size = this.frames[0].size;
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(size.x * -0.5, size.y * -0.5, size.x, size.y);
    
    this.frames.forEach((frame, frameIdx) => {
      frame.fill = palette[palette.length - 1 - frameIdx];
      frame.draw(ctx)
    });
  }
}

class Constrains {
  constructor(minAngle, maxAngle){
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
  }
}

class Segment extends Object3D{
  constructor(v, len, lenActual, constrains){
    super();
    this.constrains = constrains;
    this.angleStart = 0;
    this.angleEnd = 0;
    
    this._vector = v;
    this._length = len;
    this._lengthActual = lenActual;
    this.color = "#666";
    this.lineWidth = 70;
    
    this.v1 = new Vector3();
    this.v2 = new Vector3();
    this._center = new Vector3().copy(v).multiplyScalar(len * 0.5);
    
    this.setRandomAngleEnd();
  }
  
  setRandomAngleEnd(){
    this.angleEnd = MathUtils.randFloat(this.constrains.minAngle, this.constrains.maxAngle);
  }
  
  draw(ctx){
    let halfLength = this._lengthActual * 0.5;
    this.v1.copy(this._center).addScaledVector(this._vector, halfLength);
    this.v2.copy(this._center).addScaledVector(this._vector, -halfLength);
    this.v1.applyMatrix4(this.matrixWorld);
    this.v2.applyMatrix4(this.matrixWorld);

    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.v1.x, -this.v1.y); // upside down 
    ctx.lineTo(this.v2.x, -this.v2.y); // on Y
    ctx.stroke();
  }
}

class Segments extends Object3D {
  constructor(){
    super();
    this.name = "base";
    this.action = {val: 0};
    let zero = this;
      let torso = new Segment(new Vector3(0, 1, 0), 100, 100, new Constrains(-0.15 * Math.PI, 0.15 * Math.PI));
        let head = new Segment(new Vector3(0, 1, 0), 50, 2, new Constrains(-MathUtils.degToRad(40), MathUtils.degToRad(40)));
            head.lineWidth = 90;
            head.position.y = 150;
      
        let armRight = new Segment(new Vector3(0, -1, 0), 150, 120, new Constrains(0, Math.PI * 0.75));
            armRight.position.set(50, 110, 0);
            armRight.rotation.z = Math.PI * 0.75;
            armRight.lineWidth = 40;
        let armLeft = new Segment(new Vector3(0, -1, 0), 150, 120, new Constrains(0, Math.PI * 0.75));
            armLeft.rotation.y = Math.PI;
            armLeft.position.set(-50, 110, 0);
            armLeft.rotation.z = Math.PI * 0.25;
            armLeft.lineWidth = 40;
    
        let legRight = new Segment(new Vector3(0, -1, 0), 200, 170, new Constrains(-Math.PI * 0.15, Math.PI * 1 / 3));
            legRight.position.set(25, -40, 0);
            legRight.rotation.z = Math.PI * 0.25;
            legRight.lineWidth = 40;
        let legLeft = new Segment(new Vector3(0, -1, 0), 200, 170, new Constrains(-Math.PI * 0.15, Math.PI * 1 / 3));
            legLeft.rotation.y = Math.PI;
            legLeft.position.set(-25, -40, 0);
            legLeft.lineWidth = 40;
            legLeft.rotation.z = Math.PI * 0.25;
    
        torso.add(
          head,
          
          armRight,
          armLeft,
          
          legRight,
          legLeft
        );
      zero.add(torso);
    
      this.setRotations();
      
  }
  
  setRotations(){
    this.traverse(s => {
      if (s.name != "base"){
        s.angleStart = s.angleEnd;
        s.setRandomAngleEnd();
        //s.rotation.z = s.angleEnd;
      }
    })
  }
  
  draw(ctx, palette){
    let step = 10;
    let maxWidth = step * (palette.length - 1);
    palette.forEach((p, pIdx) => {
      
      let invPIdx = (palette.length - 1) - pIdx;
      let actionVal = MathUtils.mapLinear(this.action.val, 0.05 * invPIdx, 0.05 * invPIdx + 0.75, 0, 1);
          actionVal = MathUtils.clamp(actionVal, 0, 1);
      this.traverse(c => {
        if(c.name != "base"){
          c.rotation.z = MathUtils.clamp(MathUtils.lerp(c.angleStart, c.angleEnd, actionVal), 0, 1);
        }
      });
      
      this.updateMatrixWorld();
      
      this.traverse(c => {
        if (c.name != "base"){
          ctx.save();
          c.color = p;
          ctx.lineWidth = c.lineWidth + (maxWidth - step * pIdx);
          c.draw(ctx);
          ctx.restore();
        }
      })
    })
    
  }
}

const palettes = [ 
  // https://www.color-hex.com/color-palette/1007628
  ["#d60f84", "#68c1c9",	"#ffd400", "#fb1d36", "#9697c0"], 
  //https://www.schemecolor.com/pop-art.php
  ["#fe0879", "#ff82e2",	"#fed715", "#0037b3", "#70baff"],
  //https://color.adobe.com/ru/POP-ART-COLORS-6-color-theme-7944850/
  ["#03BFAC", "#75DFCA",	"#1DBACC", "#ED3192", "#087FBF"],
  //https://www.color-hex.com/color-palette/11427
  ["#f2b8aa", "#7fd4d7",	"#e1b6ad", "#e0679a", "#24424a"]
];

cnv.width = 600;
cnv.height = 800;
let ctx = cnv.getContext("2d");
let size = new Vector2(cnv.width, cnv.height);
let visibleSize = new Vector2(480, 640);
let center = new Vector2().copy(size).multiplyScalar(0.5);

ctx.lineCap = "round";
ctx.lineJoin = "round";

let c = new Color();

let activePalette = palettes[3];
let frames = new Frames();
frames.frames = new Array(activePalette.length).fill().map((_, idx) => {
  return new Frame(visibleSize, 30 + idx * 30, 75);
}).reverse();

let figure = new Segments();
let figurePalette = palettes[1];

cnv.addEventListener("pointerdown", event => {
  activePalette = palettes[Math.floor(Math.random() * palettes.length)];
  figurePalette = palettes[Math.floor(Math.random() * palettes.length)];
})

sequence();

function sequence(){
  figure.action.val = 0;
  new TWEEN.Tween(figure.action).to({val: 1}, 250)
    .delay(125)
    //.easing(TWEEN.Easing.Quadratic.InOut)
    .onComplete(() => {
        figure.setRotations();
        sequence();
      })
    .onUpdate(val => {
        figure.position.y = Math.sin(val.val * Math.PI) * 20;
      })
    .start();
  
}

let counter = 0;

draw();
function draw(){
  requestAnimationFrame(draw);
  //if(counter > 1000) return;
  TWEEN.update();
  
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  ctx.save();
    ctx.translate(center.x, center.y);
    frames.draw(ctx, activePalette);
    figure.draw(ctx, figurePalette);
  ctx.restore();
  
  //counter++;
}
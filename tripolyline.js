"use strict"

module.exports = triangulateLoop

var poly2tri = require("poly2tri")

//poly2tri uses "cute" x/y accessors for point members
function PointWrapper(x, y, idx) {
  this.x = x
  this.y = y
  this.idx = idx
}

function triangulatePolyline(loops, positions, perturb) {
  //Converts a loop into poly2tri format
  function convertLoop(loop) {
    return loop.map(function(v) {
      var p = positions[v]
      return new PointWrapper(
        p[0] + (0.5-Math.random())*perturb*(1.0+Math.abs(p[0])), 
        p[1] + (0.5-Math.random())*perturb*(1.0+Math.abs(p[1])), 
        v)
    })
  }

  //Find outermost loop
  var numLoops = loops.length
  var outerLoop = 0
  var outerPoint = positions[loops[0][0]]
  for(var i=0; i<numLoops; ++i) {
    var loop = loops[i]
    var n = loop.length
    for(var j=0; j<n; ++j) {
      var p = positions[loop[j]]
      var d = p[1] - outerPoint[1]
      if(d === 0) {
        d = p[0] - outerPoint[0]
      }
      if(d < 0) {
        outerPoint = p
        outerLoop = i
      }
    }
  }

  //Pass geometry to poly2tri
  var ctx = new poly2tri.SweepContext(convertLoop(loops[outerLoop]))
  for(var i=0; i<numLoops; ++i) {
    if(i === outerLoop) {
      continue
    }
    ctx.addHole(convertLoop(loops[i]))
  }

  //Triangulate
  ctx.triangulate()
  var triangles = ctx.getTriangles()

  //Unbox triangles from poly2tri format to list of indices
  return triangles.map(function(tri) {
    return [
      tri.getPoint(0).idx,
      tri.getPoint(1).idx,
      tri.getPoint(2).idx
    ]
  })
}

//poly2tri is non robust, so we run it in a loop
//If it fails, then we perturb the vertices by increasing amounts
//until it works.  (Stupid)
function triangulateLoop(loops, positions) {
  var p = 0.0
  for(var i=0; i<10; ++i) {
    try {
      return triangulatePolyline(loops, positions, p)
    }catch(e) {
    }
    p = (p+1e-8)*2
  }
  return []
}
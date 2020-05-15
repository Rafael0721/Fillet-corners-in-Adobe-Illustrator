// include json2.js to use JSON.stringiy()/JSON.parse()
// #include "json2.js";

var scaleRate = 2.83464566929135;

// how to call
// fillet("6.35/dog");

fillet(content)
function fillet(content){
  var doc = app.activeDocument;
  var pathItems = doc.pathItems;
  var compoundPaths = doc.compoundPathItems;

  var divideIndex = content.indexOf("/");
  var size = Number(content.substring(0, divideIndex));
  var filletType = content.substring(divideIndex+1);

  var knifeDia = Number(size);
  var filletSize = knifeDia * scaleRate;
  var filletRadius = filletSize/2;

  // centerPtsGroup.length is equal to originalItems.length
  var centerPtsGroup = [];
  var originalItems = [];


  // collect points of compoundPaths first
  for(var i=0; i<compoundPaths.length; i++){
    originalItems.push(compoundPaths[i]);

    var centerPtsSegments = [];
    var centerPts = [];

    for(var q=0; q<compoundPaths[i].pathItems.length; q++){
      var points = compoundPaths[i].pathItems[q].pathPoints;

      // find center point of each corner & decide which corner to make fillet
      var centerPts4singleItem = findCenterPts(points, filletRadius, filletType, true);
      centerPtsSegments.push(centerPts4singleItem);
    }

    for(var u=0; u<centerPtsSegments.length; u++){
      centerPts = centerPts.concat(centerPtsSegments[u]);
    }

    centerPtsGroup.push(centerPts);
  }

  // then collect points of other paths
  for(var i=0; i<pathItems.length; i++){
    // check if pathItems[i] is a part of compoundPaths
    var isCompoundPaths = false;
    for(var r=0; r<compoundPaths.length; r++){
      for(var t=0; t<compoundPaths[r].pathItems.length; t++){
        if(compoundPaths[r].pathItems[t].pathPoints == pathItems[i].pathPoints){
          isCompoundPaths = true;
          break;
        }
      }
      if(isCompoundPaths){
        break;
      }
    }

    if(isCompoundPaths){
      continue;
    } else{
      var points = pathItems[i].pathPoints;
      originalItems.push(pathItems[i]);

      // find center point of each corner & decide which corner to make fillet
      var centerPts = findCenterPts(points, filletRadius, filletType, false);

      centerPtsGroup.push(centerPts);
    }
  }

  // make circle and generate groups based on "centerPtsGroup" & "originalItems"
  for(var i=0; i<centerPtsGroup.length; i++){
    if(centerPtsGroup[i].length > 0){
      for(var j=0; j<centerPtsGroup[i].length; j++){
        var top = centerPtsGroup[i][j].y + filletSize/2;
        var left = centerPtsGroup[i][j].x - filletSize/2;
        var circle = doc.pathItems.ellipse(top, left, filletSize, filletSize);
        circle.selected = true;
      }

      originalItems[i].selected = true;

      app.executeMenuCommand("group");
      app.activeDocument.selection = null;
    } else{
      continue;
    }
  }

  // make final subtract for each group
  for(var i=0; i<doc.groupItems.length; i++){
    doc.groupItems[i].selected = true;
    app.executeMenuCommand("Live Pathfinder Subtract");
    app.activeDocument.selection = null;
  }

}

function getCosDeg(cos) {
  var result = Math.acos(cos) * (180 / Math.PI);
  // result = Math.round(result);
  return result;
}

function findCenterPts(points, filletRadius, filletType, isCompoundPaths){
  var centerPts = [];
  for(var j=0; j<points.length; j++){
    var previousPt, currentPt, nextPt;
    if(j == 0){
      previousPt = {x: points[points.length-1].anchor[0], y: points[points.length-1].anchor[1]};
      nextPt = {x: points[j+1].anchor[0], y: points[j+1].anchor[1]};
    } else if(j == points.length-1){
      previousPt = {x: points[j-1].anchor[0], y: points[j-1].anchor[1]};
      nextPt = {x: points[0].anchor[0], y: points[0].anchor[1]};
    } else{
      previousPt = {x: points[j-1].anchor[0], y: points[j-1].anchor[1]};
      nextPt = {x: points[j+1].anchor[0], y: points[j+1].anchor[1]};
    }

    currentPt = {x: points[j].anchor[0], y: points[j].anchor[1]};

    var bisectorPt = findPt(previousPt, currentPt, nextPt, undefined, "bisector");

    switch (filletType){
      case "dog":
        var centerPt = findPt(currentPt, undefined, bisectorPt, filletRadius, "center");
        break;
      case "typeA":
        var centerPt = findPt(currentPt, undefined, previousPt, filletRadius, "center");
        break;
      case "typeB":
        var centerPt = findPt(currentPt, undefined, nextPt, filletRadius, "center");
        break;
      case "typeI":
        if(j % 2 == 0 || j == 0){
          var centerPt = findPt(currentPt, undefined, previousPt, filletRadius, "center");
        } else{
          var centerPt = findPt(currentPt, undefined, nextPt, filletRadius, "center");
        }
        break;
      case "typeH":
        if(j % 2 == 0 || j == 0){
          var centerPt = findPt(currentPt, undefined, nextPt, filletRadius, "center");
        } else{
          var centerPt = findPt(currentPt, undefined, previousPt, filletRadius, "center");
        }
        break;
      case "normalFillet":
        var side1 = Math.sqrt(Math.pow(currentPt.x-previousPt.x, 2) + Math.pow(currentPt.y-previousPt.y, 2));
        var side2 = Math.sqrt(Math.pow(currentPt.x-nextPt.x, 2) + Math.pow(currentPt.y-nextPt.y, 2));
        var bisectorLine = Math.sqrt(Math.pow(currentPt.x-bisectorPt.x, 2) + Math.pow(currentPt.y-bisectorPt.y, 2));

        var vector4AB = {x: previousPt.x-currentPt.x, y: previousPt.y-currentPt.y};
        var vector4AC = {x: nextPt.x-currentPt.x, y: nextPt.y-currentPt.y};
        var dotValue = (vector4AB.x*vector4AC.x) + (vector4AB.y*vector4AC.y);

        var cosA = dotValue / side1 / side2;
        var angleA = getCosDeg(cosA);

        var aSide = bisectorLine * Math.sin(angleA/2*Math.PI/180);
        var center2a = filletRadius / aSide * bisectorLine;
        var centerPt = findPt(currentPt, undefined, bisectorPt, center2a, "center");
        break;
    }

    var vector4AB = {x: previousPt.x-currentPt.x, y: previousPt.y-currentPt.y};
    var vector4AC = {x: nextPt.x-currentPt.x, y: nextPt.y-currentPt.y};
    var crossValue = (vector4AB.x * vector4AC.y) - (vector4AB.y * vector4AC.x);

    // if pathItems[i] is a compoundPath, crossValue's vector(+-) is opposite
    if(isCompoundPaths){
      if(crossValue > 0){
        centerPts.push(centerPt);
      }
    } else{
      if(crossValue < 0){
        centerPts.push(centerPt);
      }
    }
  }
  return centerPts;
}

function findPt(previousPt, currentPt, nextPt, radius, str){
  var purposePt = {};

  // use bisector line theory (AB:AC = BD:DC) to find another coordinate on the bisector line
  // and use the "scale" based on two "similar triangle" to find the final cneterPt
  if(str == "bisector"){
    var side1 = Math.sqrt(Math.pow(currentPt.x-previousPt.x, 2) + Math.pow(currentPt.y-previousPt.y, 2));
    var side2 = Math.sqrt(Math.pow(currentPt.x-nextPt.x, 2) + Math.pow(currentPt.y-nextPt.y, 2));
  } else if(str == "center"){
    var side1 = radius;
    var side2 = Math.sqrt(Math.pow(nextPt.x-previousPt.x, 2) + Math.pow(nextPt.y-previousPt.y, 2));
  }

  var totalLengthX = Math.abs(nextPt.x-previousPt.x);
  var totalLengthY = Math.abs(nextPt.y-previousPt.y);
  var ratio = side1 / side2;

  var xLength = findLength(ratio, totalLengthX);
  var yLength = findLength(ratio, totalLengthY);

  if(previousPt.x > nextPt.x){
    purposePt.x = previousPt.x - xLength.a;
  } else if(previousPt.x < nextPt.x || previousPt.x == nextPt.x){
    purposePt.x = previousPt.x + xLength.a;
  }

  if(previousPt.y > nextPt.y){
    purposePt.y = previousPt.y - yLength.a;
  } else if(previousPt.y < nextPt.y || previousPt.y == nextPt.y){
    purposePt.y = previousPt.y + yLength.a;
  }

  return purposePt;
}

function findLength(ratio, all){
  // segmentA : segmentB = ratio
  //use a+b=all, a/b = ratio
  var a, b;
  b = all / (ratio+1);
  a = all -b;

  return {a: a, b: b}
}

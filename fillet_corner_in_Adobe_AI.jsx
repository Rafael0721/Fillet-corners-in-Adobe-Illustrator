// include json2.js to use JSON.stringiy()/JSON.parse()
// #include "json2.js";

// var scaleRate = 2.83;
var scaleRate = 2.83464566929135;

// fillet("6.35/dog");

function fillet(content){
  var doc = app.activeDocument;
  var pathItems = doc.pathItems;
  var compoundPaths = doc.compoundPathItems;

  var divideIndex = content.indexOf("/");
  var size = Number(content.substring(0, divideIndex));
  var filletType = content.substring(divideIndex+1);

  if(filletType === 'none'){
    return
  }

  var knifeDia = Number(size);
  var filletSize = knifeDia * scaleRate;
  var filletRadius = filletSize/2;

  var centerPtsGroup = [];
  var originalItems = [];

  // collect points of compoundPaths first
  for(var i=0; i<compoundPaths.length; i++){
    originalItems.push(compoundPaths[i]);

    var centerPts = [];

    for(var q=0; q<compoundPaths[i].pathItems.length; q++){
      var points = compoundPaths[i].pathItems[q].pathPoints;

      // find center point of each corner & decide which corner to make fillet
      var centerPts4singleItem = collectCenterPts(points, filletRadius, filletType, true);
      centerPts = centerPts.concat(centerPts4singleItem);
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
      var centerPts = collectCenterPts(points, filletRadius, filletType, false);

      centerPtsGroup.push(centerPts);
    }
  }

  // cancel all selection before grouping
  app.activeDocument.selection = null;

  // make circle and generate groups based on "centerPtsGroup" & "originalItems"
  for(var i=0; i<centerPtsGroup.length; i++){
    if(centerPtsGroup[i].length > 0){
      // var eachGroup = doc.groupItems.add();
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
  return result;
}

function collectCenterPts(points, filletRadius, filletType, isCompoundPaths){
  var centerPts = [];
  var clockwise = false;
  var count = 0;

  // determine (clockwise or not)
  for(var j=0; j<points.length; j++){
    if(j == points.length-1){
      count += (points[0].anchor[0] - points[j].anchor[0])*(points[0].anchor[1] + points[j].anchor[1]);
    } else{
      count += (points[j+1].anchor[0] - points[j].anchor[0])*(points[j+1].anchor[1] + points[j].anchor[1]);
    }
  }

  if(count > 0){
    clockwise = true;
  }

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

    var vector4AB = {x: previousPt.x-currentPt.x, y: previousPt.y-currentPt.y};
    var vector4AC = {x: nextPt.x-currentPt.x, y: nextPt.y-currentPt.y};
    var crossValue = (vector4AB.x * vector4AC.y) - (vector4AB.y * vector4AC.x);

    // if pathItems[i] is a compoundPath, crossValue's vector(+-) is opposite
    if(isCompoundPaths){
      if(crossValue > 0){
        // getCenterPt() only executed when points[j] is qualified to be pushed to centerPts
        var centerPt = getCenterPt(j, previousPt, currentPt, nextPt, filletType, filletRadius);
        centerPts.push(centerPt);
      }
    } else {
      if(clockwise){
        if(crossValue < 0){
          var centerPt = getCenterPt(j, previousPt, currentPt, nextPt, filletType, filletRadius);
          centerPts.push(centerPt);
        }
      } else {
        if(crossValue > 0){
          var centerPt = getCenterPt(j, previousPt, currentPt, nextPt, filletType, filletRadius);
          centerPts.push(centerPt);
        }
      }
    }
  }

  return centerPts;
}

function getCenterPt(index, previousPt, currentPt, nextPt, filletType, filletRadius){
  var bisectorPt = findPt(previousPt, currentPt, nextPt, undefined, "bisector");
  var centerPt;

  switch (filletType){
    case "dog":
      centerPt = findPt(currentPt, undefined, bisectorPt, filletRadius, "center");
      break;
    case "typeA":
      centerPt = findPt(currentPt, undefined, previousPt, filletRadius, "center");
      break;
    case "typeB":
      centerPt = findPt(currentPt, undefined, nextPt, filletRadius, "center");
      break;
    case "typeI":
      if(index % 2 == 0 || index == 0){
        centerPt = findPt(currentPt, undefined, previousPt, filletRadius, "center");
      } else{
        centerPt = findPt(currentPt, undefined, nextPt, filletRadius, "center");
      }
      break;
    case "typeH":
      if(index % 2 == 0 || index == 0){
        centerPt = findPt(currentPt, undefined, nextPt, filletRadius, "center");
      } else{
        centerPt = findPt(currentPt, undefined, previousPt, filletRadius, "center");
      }
      break;
    case "normalFillet":
      var side1 = findHypo(currentPt.x-previousPt.x, currentPt.y-previousPt.y);
      var side2 = findHypo(currentPt.x-nextPt.x, currentPt.y-nextPt.y);
      var bisectorLine = findHypo(currentPt.x-bisectorPt.x, currentPt.y-bisectorPt.y);

      var vector4AB = {x: previousPt.x-currentPt.x, y: previousPt.y-currentPt.y};
      var vector4AC = {x: nextPt.x-currentPt.x, y: nextPt.y-currentPt.y};
      var dotValue = (vector4AB.x*vector4AC.x) + (vector4AB.y*vector4AC.y);

      var cosA = dotValue / side1 / side2;
      var angleA = getCosDeg(cosA);

      var aSide = bisectorLine * Math.sin(angleA/2*Math.PI/180);
      var center2a = filletRadius / aSide * bisectorLine;
      centerPt = findPt(currentPt, undefined, bisectorPt, center2a, "center");
      break;
  }

  return centerPt
}

function findPt(previousPt, currentPt, nextPt, radius, whatToFind){
  var purposePt = {};

  // use bisector line theory (AB:AC = BD:DC) to find another coordinate on the bisector line
  // and use the "scale" based on two "similar triangle" to find the final cneterPt
  if(whatToFind === "bisector"){
    var side1 = findHypo(currentPt.x-previousPt.x, currentPt.y-previousPt.y);
    var side2 = findHypo(currentPt.x-nextPt.x, currentPt.y-nextPt.y);
  } else if(whatToFind === "center"){
    var side1 = radius;
    var side2 = findHypo(nextPt.x-previousPt.x, nextPt.y-previousPt.y) - radius;
  }

  // find totoal length of X and Y
  var totalLengthX = Math.abs(nextPt.x-previousPt.x);
  var totalLengthY = Math.abs(nextPt.y-previousPt.y);
  var ratio = side1 / side2;

  // find the x & y length of smaller triangle
  var xLength = findLength(ratio, totalLengthX);
  var yLength = findLength(ratio, totalLengthY);

  // find the exact coordinate of the prupose point
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

// return the hypotenuse length of a certain triangle
function findHypo(aSide, bSide){
  var hypotenuse = Math.sqrt(Math.pow(aSide, 2) + Math.pow(bSide, 2));
  return hypotenuse;
}

function findLength(ratio, all){
  var a, b;
  // segmentA / segmentB = ratio
  //segmentA + segmentB = all
  b = all / (ratio+1);
  a = all - b;

  return {a: a, b: b}
}

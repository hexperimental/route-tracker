var stopSpeed = 2.5;

$(function() {


   jQuery.get('./data.php',function(data) {
      dataArr = JSON.parse( data );
      var index=0;
      for( file in dataArr ){
         index++;
         (function(e){
            e.find('.row').attr('id','route-'+index);
            jQuery.get(dataArr[file], function(xmlDoc) {
               trackData = parseGPX( xmlDoc );
               e.data = trackData;
               e.attr('data-file',dataArr[file]);
               e.find('.title').html( trackData.title  );
               e.find('.hour').html( trackData.startDate.getHours()+" : "+trackData.startDate.getMinutes()  );
               e.find('.duration').html( formatTime( trackData.duration )  );
               e.find('.distance').html( trackData.distance + "km"  );
               e.find('.top-speed').html( trackData.topSpeed + "kph"  );
               e.find('.avg-speed').html( trackData.avgSpeed + "kph" );
               e.find('.active-time').html( formatTime( trackData.active ) );
               e.find('.inactive-time').html( formatTime( trackData.inactive ) );
               if( trackData.startDate.getHours() <= 12 ){ //move to the morning list
                  e.appendTo("ul#morning-list");
               }
               e.click(function(){
                 loadMap( e.data.segments );
               });
            });
          })( $(".route-item.tpl").clone().appendTo("ul#afternoon-list").removeClass('tpl') );
      }
   });
});

function parseGPX( xmlDoc ){
    var points = xmlDoc.documentElement.getElementsByTagName("trkpt");
      var routeTitle = xmlDoc.documentElement.getElementsByTagName("trk");
      routeTitle = routeTitle.item(0).getElementsByTagName("name").item(0).childNodes[0].nodeValue;
      var topSpeed = 0;
      var avgSpeed = 0;
      var totDistance = 0;
      var lastPoint = points.length - 1;
      var startDate = new Date( points[0].getElementsByTagName("time").item(0).childNodes[0].nodeValue);
      var startTime = startDate.getTime();
      var finishDate= new Date( points[lastPoint].getElementsByTagName("time").item(0).childNodes[0].nodeValue );
      var finishTime= finishDate.getTime();
      var duration = finishTime - startTime;
      var movingTime = 0;
      var segment = [];
      for( var i=0; i< points.length;i++ ){
         if( i > 0 ){
            var speedData = getSpeedData( points[i-1], points[i] );
            topSpeed = ( speedData.kph > topSpeed ) ? speedData.kph : topSpeed;
            movingTime += ( speedData.kph > stopSpeed ) ? speedData.time : 0;
            totDistance += speedData.distance;
            segment.push({lat1:speedData.lat1,
                          lng1:speedData.lng1,
                          lat2:speedData.lat2,
                          lng2:speedData.lng2,
                          speed:speedData.kph });
         }
      }
      avgSpeed = ( totDistance / 1000 ) / ( ( ( duration / 1000 ) /60 ) / 60 );
      return {
         title:routeTitle,
         segments:segment,
         startDate:startDate,
         finishDate:finishDate,
         duration: duration,
         distance: Math.round( totDistance/1000 ),
         topSpeed: Math.round( topSpeed ),
         avgSpeed: Math.round( avgSpeed ),
         active: movingTime,
         inactive: duration - movingTime,
      }
}

function getColorForSpeed( speed ){
   var color = "#000";
   if( speed < stopSpeed ){
      color = "#610099";
   }else if(speed < 5){
      color = "f00";
   }else if(speed < 30){
      color = "#FA8100";
   }else if(speed < 50){
      color = "#fd0";
   }else if(speed < 80){
      color = "#0f0";
   } else {
      color = "#090";
   }
 return color;
}

function getSpeedData(pt1,pt2){

   var lat1 = pt1.getAttribute("lat") * Math.PI / 180;
   var lng1 = pt1.getAttribute("lon") * Math.PI / 180;
   var ts1 =  new Date(pt1.getElementsByTagName("time").item(0).childNodes[0].nodeValue).getTime();

   var lat2 = pt2.getAttribute("lat") * Math.PI / 180;
   var lng2 = pt2.getAttribute("lon") * Math.PI / 180;
   var ts2 =  new Date(pt2.getElementsByTagName("time").item(0).childNodes[0].nodeValue).getTime();

   var r = 6378100;

   var rho1 = r * Math.cos(lat1);
   var z1 = r * Math.sin(lat1);
   var x1 = rho1 * Math.cos(lng1);
   var y1 = rho1 * Math.sin(lng1);

   var rho2 = r * Math.cos(lat2);
   var z2 = r * Math.sin(lat2);
   var x2 = rho2 * Math.cos(lng2);
   var y2 = rho2 * Math.sin(lng2);

   var dot = (x1 * x2 + y1 * y2 + z1 *z2 );
   var cos_t = dot / ( r * r );
   var t = Math.acos( cos_t );
   t = ( isNaN(t) ) ? 0 : t; //shit happens
   var time = (ts2 - ts1);
   distance =  r * t;
   speed_mps = distance / ( time / 1000 );
   kph = ( speed_mps * 3600 ) / 1000;
   return { lat1:pt1.getAttribute("lat"),
            lng1:pt1.getAttribute("lon"),
            lat2:pt2.getAttribute("lat"),
            lng2:pt2.getAttribute("lon"),
            distance:distance,
            kph:kph,
            time:time };
};


function formatTime( ms ){
   sec =Math.round( ( ms / 1000 ) % 60 );
   min =Math.round( ( ( ms - sec ) / 1000 ) / 60 );
   if(sec < 10){sec = "0"+sec;}
   if(min < 10){min = "0"+min;}
   return min+":"+sec;
}


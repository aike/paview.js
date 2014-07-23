##PaView.js - JavaScript Spherical Movie Viewer

##Description
PaView.js is a JavaScript spherical movie viewer program.

##How To Use
load script with [Three.js](http://threejs.org/)

    <script type="text/javascript" src="three.min.js"></script>
    <script type="text/javascript" src="paview.js"></script>

simple example

    <div id="mov1"></div>
    <script type="text/javascript" >
        var img1 = new PaView({
            id:'mov1',
            file:'panorama1.mp4',
            srcwidth: 1024,
            srcheight: 512
        });
    </script>

with customize option

    <div id="mov2"></div>
    <script type="text/javascript" >
        var img2 = new PaView({
            id:'mov2',
            file:'panorama2.mp4',
            srcwidth: 1024,
            srcheight: 512,
            firstview:180,
            zoom:100,
            width:700,
            height:400
        });
    </script>


##Option
| keyword |   description   |  range |  default |
|:----------:|:------------------|:--------:|:---------:|
|  id  |  ID of parent div element (required)| - | - |
| file  | image file name (required)| - | - |
| srcwidth  | width of movie (required)| number | - |
| srcheight  | height of movie (required)| number | - |
| width  | width of view area | number | 500  |
| height  | height of view area | number | 300  |
| rotation  | start rotation on page load | true/false | false  |
| speed    | rotation speed | -100..100 | 10 |
| zoom    | zoom up image | 10..500 | 70 |
| firstview | degree of initial image | 0..360 | 0 |
| degree | array of axis angle [x, y, z]| [0..360,0..360,0..360] | [0,0,0] |

##Demo Page
http://aikelab.net/paview/

##NOTE
 - PaView.js requires web server. It does not work from local file.
 - The movie file must be located at same origin.

##Credit
PaView.js is licenced under MIT License. Copyright 2014, aike (@aike1000)

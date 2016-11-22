(function() {
  var svg;

  // Save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    filters: {},
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        hideHawaiiAndAlaska : false,
        borderWidth: 1,
        borderOpacity: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderOpacity: 1,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        radius: null,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600,
      popupOnHover: false,
      popupTemplate: function(geography, data) {
        // Case with latitude and longitude
        if ( ( data.origin && data.destination ) && data.origin.latitude && data.origin.longitude && data.destination.latitude && data.destination.longitude ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>Origin: ' + JSON.stringify(data.origin) + '<br>Destination: ' + JSON.stringify(data.destination) + '</div>';
        }
        // Case with only country name
        else if ( data.origin && data.destination ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>' + data.origin + ' -> ' + data.destination + '</div>';
        }
        // Missing information
        else {
          return '';
        }
      }
    }
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
      context = optionsValue;
      optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return  null;
    }

    if ( typeof value === 'function' ) {
      var fnContext = [context];
      if ( context.geography ) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    }
    else {
      return value;
    }
  }

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': (this.options.aspectRatio*100) + '%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');

    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path:not(.datamaps-arc), .datamap circle, .datamap line {stroke: #FFFFFF; vector-effect: non-scaling-stroke; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;

    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    if ( geoConfig.hideHawaiiAndAlaska ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "HI" && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        // If fillKey - use that
        // Otherwise check 'fill'
        // Otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if ( datum && datum.fillKey ) {
          fillColor = fillData[ val(datum.fillKey, {data: colorCodeData[d.id], geography: d}) ];
        }

        if ( typeof fillColor === 'undefined' ) {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {data: colorCodeData[d.id], geography: d});
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke-opacity', geoConfig.borderOpacity)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);
          var datum = self.options.data[d.id] || {};
          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));

            // As per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident))/.test(navigator.userAgent) ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  // Plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    var path = d3.geo.path()
        .projection(self.projection);

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          return val(datum.strokeColor, options.strokeColor, datum);
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
            return val(datum.strokeWidth, options.strokeWidth, datum);
        })
        .attr('d', function(datum) {

            var originXY, destXY;

            if (typeof datum.origin === "string") {
              switch (datum.origin) {
                   case "CAN":
                       originXY = self.latLngToXY(56.624472, -114.665293);
                       break;
                   case "CHL":
                       originXY = self.latLngToXY(-33.448890, -70.669265);
                       break;
                   case "HRV":
                       originXY = self.latLngToXY(45.815011, 15.981919);
                       break;
                   case "IDN":
                       originXY = self.latLngToXY(-6.208763, 106.845599);
                       break;
                   case "JPN":
                       originXY = self.latLngToXY(35.689487, 139.691706);
                       break;
                   case "MYS":
                       originXY = self.latLngToXY(3.139003, 101.686855);
                       break;
                   case "NOR":
                       originXY = self.latLngToXY(59.913869, 10.752245);
                       break;
                   case "USA":
                       originXY = self.latLngToXY(41.140276, -100.760145);
                       break;
                   case "VNM":
                       originXY = self.latLngToXY(21.027764, 105.834160);
                       break;
                   default:
                       originXY = self.path.centroid(svg.select('path.' + datum.origin).data()[0]);
               }
            } else {
              originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum))
            }

            if (typeof datum.destination === 'string') {
              switch (datum.destination) {
                    case "CAN":
                        destXY = self.latLngToXY(56.624472, -114.665293);
                        break;
                    case "CHL":
                        destXY = self.latLngToXY(-33.448890, -70.669265);
                        break;
                    case "HRV":
                        destXY = self.latLngToXY(45.815011, 15.981919);
                        break;
                    case "IDN":
                        destXY = self.latLngToXY(-6.208763, 106.845599);
                        break;
                    case "JPN":
                        destXY = self.latLngToXY(35.689487, 139.691706);
                        break;
                    case "MYS":
                        destXY = self.latLngToXY(3.139003, 101.686855);
                        break;
                    case "NOR":
                        destXY = self.latLngToXY(59.913869, 10.752245);
                        break;
                    case "USA":
                        destXY = self.latLngToXY(41.140276, -100.760145);
                        break;
                    case "VNM":
                        destXY = self.latLngToXY(21.027764, 105.834160);
                        break;
                    default:
                        destXY = self.path.centroid(svg.select('path.' + datum.destination).data()[0]);
              }
            } else {
              destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
            }
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            if (options.greatArc) {
                  // TODO: Move this to inside `if` clause when setting attr `d`
              var greatArc = d3.geo.greatArc()
                  .source(function(d) { return [val(d.origin.longitude, d), val(d.origin.latitude, d)]; })
                  .target(function(d) { return [val(d.destination.longitude, d), val(d.destination.latitude, d)]; });

              return path(greatArc(datum))
            }
            var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * sharpness)) + "," + (midXY[1] - (75 * sharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition()
          .delay(100)
          .style('fill', function(datum) {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + val(datum.animationSpeed, options.animationSpeed, datum) + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1)
        }

          layer.append("text")
              .attr("x", x)
              .attr("y", y)
              .style("font-size", (options.fontSize || 10) + 'px')
              .style("font-family", options.fontFamily || "Verdana")
              .style("fill", options.labelColor || "#000")
              .text(function() {
                  if (options.customLabelText && options.customLabelText[d.id]) {
                      return options.customLabelText[d.id]
                  } else {
                      return d.id
                  }
              });

        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, options.key );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[1];
        })
        .attr('r', function(datum) {
          // If animation enabled start with radius 0, otherwise use full size.
          return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .attr('filter', function (datum) {
          var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

          if (filterKey) {
            return filterKey;
          }
        })
        .style('stroke', function ( datum ) {
          return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
          return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('stroke-opacity', function ( datum ) {
          return val(datum.borderOpacity, options.borderOpacity, datum);
        })
        .style('fill-opacity', function ( datum ) {
          return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })

    bubbles.transition()
      .duration(400)
      .attr('r', function ( datum ) {
        return val(datum.radius, options.radius, datum);
      })
    .transition()
      .duration(0)
      .attr('data-info', function(d) {
        return JSON.stringify(d);
      });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }
  }

  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          // Deep copy if property not set
          if (obj[prop] == null) {
            if (typeof source[prop] == 'function') {
              obj[prop] = source[prop];
            }
            else {
              obj[prop] = JSON.parse(JSON.stringify(source[prop]));
            }
          }
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }
    // Set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    // Add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    // Add core plugins to this instance
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    // Append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // Resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').attr('transform', 'scale(' + (newsize / oldsize) + ')');
    }
  }

  // Actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    // Save off in a closure
    var self = this;
    var options = self.options;

    // Set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(this, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    // If custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // If fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          // Allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            // In the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        // Fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = '__PSX__';
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = {"type":"Topology","objects":{"lva":{"type":"GeometryCollection","geometries":[{"type":"Polygon","properties":{"name":"Balvu"},"id":"LV.BV","arcs":[[0,1,2,3,4,5,6,7,8]]},{"type":"Polygon","properties":{"name":"Kraslavas"},"id":"LV.KS","arcs":[[9,10,11,12]]},{"type":"Polygon","properties":{"name":"Ludzas"},"id":"LV.LZ","arcs":[[13,14,15,16,17]]},{"type":"Polygon","properties":{"name":"Rezeknes"},"id":"LV.RK","arcs":[[18,19,-17,20,21,22,23,24,-4],[25]]},{"type":"Polygon","properties":{"name":"Saldus"},"id":"LV.SD","arcs":[[26,27,28,29,30,31,32]]},{"type":"Polygon","properties":{"name":"Aluksne"},"id":"LV.AE","arcs":[[33,-9,34,35,36]]},{"type":"Polygon","properties":{"name":"Valkas"},"id":"LV.VA","arcs":[[37,38,39,40,41,42]]},{"type":"Polygon","properties":{"name":"Bauska"},"id":"LV.BK","arcs":[[43,44,45,46,47]]},{"type":"Polygon","properties":{"name":"Cesu"},"id":"LV.CS","arcs":[[48,49,50,51]]},{"type":"Polygon","properties":{"name":"Daugavpils"},"id":"LV.DP","arcs":[[52,53,-11,54,55,56,57,58],[59]]},{"type":"Polygon","properties":{"name":"Dobele"},"id":"LV.DB","arcs":[[60,61,62,63,64,65]]},{"type":"Polygon","properties":{"name":"Gulbene"},"id":"LV.GU","arcs":[[-35,-8,66,67,68,69,70,71,72,73,74]]},{"type":"Polygon","properties":{"name":"Jelgava"},"id":"LV.JL","arcs":[[75,76,77,78,79,80,81,-66,82,83]]},{"type":"Polygon","properties":{"name":"Jekabpils"},"id":"LV.JB","arcs":[[84,85,86]]},{"type":"Polygon","properties":{"name":"Limbaži"},"id":"LV.LI","arcs":[[87,88,89,90,91,92,93,94]]},{"type":"Polygon","properties":{"name":"Madona"},"id":"LV.MD","arcs":[[-71,95,-69,96,-5,-25,97,98,99,100,101,102]]},{"type":"Polygon","properties":{"name":"Ogre"},"id":"LV.OR","arcs":[[103,104,105,106,107,108,109,110,111,112]]},{"type":"Polygon","properties":{"name":"Preilu"},"id":"LV.PI","arcs":[[-53,113,114,115]]},{"type":"Polygon","properties":{"name":"Talsi"},"id":"LV.TL","arcs":[[116,117,118,119,120,121,122,123]]},{"type":"Polygon","properties":{"name":"Tukums"},"id":"LV.TK","arcs":[[124,125,-83,-65,126,127,-119,128,129]]},{"type":"Polygon","properties":{"name":"Valmiera"},"id":"LV.VE","arcs":[[130,131,132]]},{"type":"Polygon","properties":{"name":"Riga"},"id":"LV.RA","arcs":[[133,134,135,136,137,138,139,140,141,142]]},{"type":"MultiPolygon","properties":{"name":"Liepāja"},"id":"LV.LJ","arcs":[[[143,144]],[[145,146]]]},{"type":"Polygon","properties":{"name":"Jelgava"},"id":"LV.JE","arcs":[[-78,147]]},{"type":"Polygon","properties":{"name":"Daugavpils"},"id":"LV.DV","arcs":[[-60]]},{"type":"Polygon","properties":{"name":"Rezekne"},"id":"LV.RE","arcs":[[-26]]},{"type":"Polygon","properties":{"name":"Ventspils"},"id":"LV.VS","arcs":[[148,149]]},{"type":"Polygon","properties":{"name":"Kuldigas"},"id":"LV.KD","arcs":[[150,-32,151,152,153,154,155,-121]]},{"type":"Polygon","properties":{"name":"Alsungas"},"id":"LV.AS","arcs":[[156,157,-155]]},{"type":"Polygon","properties":{"name":"Brocenu"},"id":"LV.BR","arcs":[[158,-63,159,-27,160]]},{"type":"Polygon","properties":{"name":"Skrundas"},"id":"LV.SK","arcs":[[-31,161,162,-152]]},{"type":"Polygon","properties":{"name":"Vainodes"},"id":"LV.VD","arcs":[[-30,163,164,165,-162]]},{"type":"Polygon","properties":{"name":"Aizputes"},"id":"LV.AZ","arcs":[[-163,-166,166,167,168,-153]]},{"type":"Polygon","properties":{"name":"Priekules"},"id":"LV.PK","arcs":[[-167,-165,169,170,171,172]]},{"type":"Polygon","properties":{"name":"Grobinas"},"id":"LV.GR","arcs":[[173,-172,174,175,176,-147,177,178]]},{"type":"Polygon","properties":{"name":"Nicas"},"id":"LV.NI","arcs":[[179,180,-145,181,-176]]},{"type":"Polygon","properties":{"name":"Rucavas"},"id":"LV.RC","arcs":[[-175,-171,182,-180]]},{"type":"Polygon","properties":{"name":"Pavilostas"},"id":"LV.PT","arcs":[[-157,-154,-169,183,-179,184,185]]},{"type":"Polygon","properties":{"name":"Durbes"},"id":"LV.DR","arcs":[[-168,-173,-174,-184]]},{"type":"Polygon","properties":{"name":"Dundagas"},"id":"LV.DN","arcs":[[186,-123,187,188]]},{"type":"Polygon","properties":{"name":"Rojas"},"id":"LV.RR","arcs":[[189,-124,-187]]},{"type":"Polygon","properties":{"name":"Mersraga"},"id":"LV.ME","arcs":[[190,-129,-118,191]]},{"type":"Polygon","properties":{"name":"Neretas"},"id":"LV.NE","arcs":[[192,193,194,195]]},{"type":"Polygon","properties":{"name":"Jekabpils"},"id":"LV.JP","arcs":[[196,-57,197,198,199,200,-85,201]]},{"type":"Polygon","properties":{"name":"Krustpils"},"id":"LV.KT","arcs":[[202,203,204,-202,-87,205,206,-99]]},{"type":"Polygon","properties":{"name":"Salas"},"id":"LV.SC","arcs":[[-206,-86,-201,207,208,209]]},{"type":"Polygon","properties":{"name":"Plavinu"},"id":"LV.PL","arcs":[[-207,-210,210,211,212,-100]]},{"type":"Polygon","properties":{"name":"Kokneses"},"id":"LV.KO","arcs":[[-212,213,214,-104,215]]},{"type":"Polygon","properties":{"name":"Aizkraukles"},"id":"LV.AK","arcs":[[-215,216,217,-105]]},{"type":"Polygon","properties":{"name":"Skriveru"},"id":"LV.SR","arcs":[[-218,218,219,220,-106]]},{"type":"Polygon","properties":{"name":"Jaunjelgavas"},"id":"LV.JJ","arcs":[[-211,-209,221,-196,222,223,-219,-217,-214]]},{"type":"Polygon","properties":{"name":"Viesites"},"id":"LV.VT","arcs":[[-200,224,225,-193,-222,-208]]},{"type":"Polygon","properties":{"name":"Aknistes"},"id":"LV.AN","arcs":[[226,227,-225,-199]]},{"type":"Polygon","properties":{"name":"Vecumnieku"},"id":"LV.VC","arcs":[[-223,-195,228,-44,229,230,231]]},{"type":"Polygon","properties":{"name":"Iecavas"},"id":"LV.IE","arcs":[[-230,-48,232,233,234]]},{"type":"Polygon","properties":{"name":"Ozolnieku"},"id":"LV.OZ","arcs":[[235,236,-233,-47,237,-79,-148,-77,238]]},{"type":"Polygon","properties":{"name":"Rundales"},"id":"LV.RD","arcs":[[-46,239,-80,-238]]},{"type":"Polygon","properties":{"name":"Tervetes"},"id":"LV.TE","arcs":[[-82,240,241,-61]]},{"type":"Polygon","properties":{"name":"Auces"},"id":"LV.AU","arcs":[[-242,242,-28,-160,-62]]},{"type":"Polygon","properties":{"name":"Rugaju"},"id":"LV.RJ","arcs":[[243,-67,-7]]},{"type":"Polygon","properties":{"name":"Vilakas"},"id":"LV.VL","arcs":[[244,-1,-34,245]]},{"type":"Polygon","properties":{"name":"Baltinavas"},"id":"LV.BA","arcs":[[246,-2,-245,247]]},{"type":"Polygon","properties":{"name":"Karsavas"},"id":"LV.KA","arcs":[[248,-19,-3,-247,249]]},{"type":"Polygon","properties":{"name":"Ciblas"},"id":"LV.CI","arcs":[[250,-18,-20,-249]]},{"type":"Polygon","properties":{"name":"Zilupes"},"id":"LV.ZI","arcs":[[251,252,-15]]},{"type":"Polygon","properties":{"name":"Dagdas"},"id":"LV.DD","arcs":[[-16,-253,253,-13,254,-21]]},{"type":"Polygon","properties":{"name":"Aglonas"},"id":"LV.AG","arcs":[[-255,-12,-54,255,-22]]},{"type":"Polygon","properties":{"name":"Ilukstes"},"id":"LV.IL","arcs":[[-56,256,-227,-198]]},{"type":"Polygon","properties":{"name":"Livanu"},"id":"LV.LV","arcs":[[257,-115,258,-58,-197,-205]]},{"type":"Polygon","properties":{"name":"Varkavas"},"id":"LV.VV","arcs":[[-114,-59,-259]]},{"type":"Polygon","properties":{"name":"Riebinu"},"id":"LV.RB","arcs":[[-23,-256,-116,-258,-204,259,260]]},{"type":"Polygon","properties":{"name":"Vilanu"},"id":"LV.VI","arcs":[[-261,261,-24]]},{"type":"Polygon","properties":{"name":"Ādaži"},"id":"LV.AD","arcs":[[262,263,264,265]]},{"type":"Polygon","properties":{"name":"Alojas"},"id":"LV.AJ","arcs":[[266,267,268,-95,269,270]]},{"type":"Polygon","properties":{"name":"Babites"},"id":"LV.BB","arcs":[[271,272,-84,-126,273,-140]]},{"type":"Polygon","properties":{"name":"Baldones"},"id":"LV.BD","arcs":[[274,-231,-235,275,276]]},{"type":"Polygon","properties":{"name":"Carnikavas"},"id":"LV.CR","arcs":[[-265,277,-143,278,279]]},{"type":"Polygon","properties":{"name":"Engures"},"id":"LV.EN","arcs":[[280,-130,-191,281]]},{"type":"Polygon","properties":{"name":"Garkalnes"},"id":"LV.GA","arcs":[[282,283,-134,-278,-264,284]]},{"type":"Polygon","properties":{"name":"Ikskiles"},"id":"LV.IK","arcs":[[-109,285,286,287,288]]},{"type":"Polygon","properties":{"name":"Incukalna"},"id":"LV.IN","arcs":[[289,290,-285,291,292]]},{"type":"Polygon","properties":{"name":"Jaunpils"},"id":"LV.JU","arcs":[[-127,-64,-159,293]]},{"type":"Polygon","properties":{"name":"Jurmala"},"id":"LV.JM","arcs":[[-274,-125,-281,294,-141]]},{"type":"Polygon","properties":{"name":"Kandavas"},"id":"LV.KN","arcs":[[-294,-161,-33,-151,-120,-128]]},{"type":"Polygon","properties":{"name":"Keguma"},"id":"LV.KG","arcs":[[295,-220,-224,-232,-275,296,-286,-108]]},{"type":"Polygon","properties":{"name":"Kekavas"},"id":"LV.KK","arcs":[[297,-287,-297,-277,298,-236,299,-137]]},{"type":"Polygon","properties":{"name":"Krimuldas"},"id":"LV.KM","arcs":[[300,301,302,-293,303,-90]]},{"type":"Polygon","properties":{"name":"Lielvardes"},"id":"LV.LL","arcs":[[-221,-296,-107]]},{"type":"Polygon","properties":{"name":"Malpils"},"id":"LV.ML","arcs":[[304,-111,305,306]]},{"type":"Polygon","properties":{"name":"Marupes"},"id":"LV.MR","arcs":[[307,-272,-139]]},{"type":"MultiPolygon","properties":{"name":"Olaines"},"id":"LV.OL","arcs":[[[-237,-299,-276,-234]],[[-138,-300,-239,-76,-273,-308]]]},{"type":"Polygon","properties":{"name":"Ropazu"},"id":"LV.RP","arcs":[[-306,-110,-289,308,309,-283,-291,310]]},{"type":"Polygon","properties":{"name":"Salacgrivas"},"id":"LV.SL","arcs":[[-270,-94,311]]},{"type":"Polygon","properties":{"name":"Salaspils"},"id":"LV.SS","arcs":[[-309,-288,-298,-136,312]]},{"type":"Polygon","properties":{"name":"Saulkrastu"},"id":"LV.SU","arcs":[[313,-266,-280,314,-92]]},{"type":"Polygon","properties":{"name":"Sejas"},"id":"LV.SE","arcs":[[-304,-292,-263,-314,-91]]},{"type":"Polygon","properties":{"name":"Siguldas"},"id":"LV.SI","arcs":[[315,-307,-311,-290,-303,316]]},{"type":"Polygon","properties":{"name":"Stopinu"},"id":"LV.SP","arcs":[[-310,-313,-135,-284]]},{"type":"Polygon","properties":{"name":"Amatas"},"id":"LV.AM","arcs":[[317,318,-112,-305,-316,319,320,-50]]},{"type":"Polygon","properties":{"name":"Apes"},"id":"LV.AP","arcs":[[-36,-75,321,-38,322]]},{"type":"Polygon","properties":{"name":"Beverinas"},"id":"LV.BE","arcs":[[323,324,325,-131,326,327]]},{"type":"Polygon","properties":{"name":"Burtnieku"},"id":"LV.BT","arcs":[[328,329,-41,330,-327,-133,331,-268,332]]},{"type":"Polygon","properties":{"name":"Cesvaines"},"id":"LV.CV","arcs":[[-96,-70]]},{"type":"Polygon","properties":{"name":"Erglu"},"id":"LV.ER","arcs":[[-101,-213,-216,-113,-319,333]]},{"type":"Polygon","properties":{"name":"Jaunpiebalgas"},"id":"LV.JA","arcs":[[-103,334,335,-72]]},{"type":"Polygon","properties":{"name":"Kocenu"},"id":"LV.VR","arcs":[[-132,-326,336,337,-88,-269,-332]]},{"type":"Polygon","properties":{"name":"Ligatnes"},"id":"LV.LG","arcs":[[-317,-302,338,-320]]},{"type":"Polygon","properties":{"name":"Lubanas"},"id":"LV.LB","arcs":[[-244,-6,-97,-68]]},{"type":"Polygon","properties":{"name":"Mazsalacas"},"id":"LV.MZ","arcs":[[-333,-267,339,340]]},{"type":"Polygon","properties":{"name":"Nauksenu"},"id":"LV.NA","arcs":[[-42,-330,341,342]]},{"type":"Polygon","properties":{"name":"Pargaujas"},"id":"LV.PG","arcs":[[343,-51,-321,-339,-301,-89,-338]]},{"type":"Polygon","properties":{"name":"Priekulu"},"id":"LV.PU","arcs":[[344,345,-52,-344,-337,-325]]},{"type":"Polygon","properties":{"name":"Strencu"},"id":"LV.ST","arcs":[[346,-328,-331,-40]]},{"type":"Polygon","properties":{"name":"Rujienas"},"id":"LV.RU","arcs":[[-342,-329,-341,347]]},{"type":"Polygon","properties":{"name":"Vecpiebalgas"},"id":"LV.VB","arcs":[[-335,-102,-334,-318,-49,-346,348,349,350]]},{"type":"Polygon","properties":{"name":"Smiltenes"},"id":"LV.SM","arcs":[[-322,-74,351,-350,352,-324,-347,-39]]},{"type":"MultiPolygon","properties":{"name":"Raunas"},"id":"LV.RN","arcs":[[[-73,-336,-351,-352]],[[-349,-345,-353]]]},{"type":"Polygon","properties":{"name":"Varaklanu"},"id":"LV.VX","arcs":[[-262,-260,-203,-98]]},{"type":"Polygon","properties":{"name":"Ventspils"},"id":"LV.VN","arcs":[[-122,-156,-158,-186,353,-150,354,-188]]}]}},"arcs":[[[8992,6672],[-57,-124],[-28,-133],[-31,-217],[72,-189],[82,-142],[37,-10],[16,-161],[50,19],[57,-19],[9,-85]],[[9199,5611],[38,-123],[-72,-19],[-129,-123],[25,-85],[-60,-85],[-69,10],[-37,-57],[25,-76],[16,-130]],[[8936,4923],[-26,-6],[-22,-24],[-22,-39],[-7,-17],[6,-16],[-16,-28],[-10,-3],[-7,6],[-4,10],[-8,1],[-10,-13],[-10,-27],[0,-33],[-4,-23],[4,-72],[-11,-6]],[[8789,4633],[-134,27],[-78,19],[-35,73],[-38,-13],[-17,10],[-35,-6],[-39,-16],[-13,-21],[-36,4],[-20,21],[-46,-2],[-25,15],[-52,90]],[[8221,4834],[22,38],[12,26]],[[8255,4898],[38,79],[4,21],[2,31]],[[8299,5029],[71,24],[66,-38],[113,-56],[47,0],[35,141],[56,86],[35,47],[56,38],[-25,180],[-38,-29],[-34,0],[-10,85],[48,29],[34,104],[16,151],[-28,19],[-48,-9],[-100,56],[-69,48],[-41,-19],[-28,28],[0,95],[-66,-10],[-58,11]],[[8331,6010],[79,172],[36,59],[53,123],[37,111]],[[8536,6475],[38,7],[23,28],[27,-2],[12,19],[7,16],[9,15],[10,11],[38,-10],[70,128],[39,30],[71,-90],[75,46],[37,-1]],[[9368,1281],[-21,-65],[-137,-154],[-39,-184],[-10,-197],[-11,-89],[-13,-64],[-38,-8],[-174,27],[-45,23],[-43,44],[-35,68],[-28,-57],[-65,-106],[-26,-20],[-38,36],[-86,124],[-30,28],[-56,16],[-179,-39],[-3,-3]],[[8291,661],[0,2],[0,2],[1,49],[2,24],[-1,44],[-4,37],[-60,40],[0,78],[5,47],[12,30],[11,68],[-26,19],[12,39],[16,36],[-12,41],[-5,28],[-15,151],[48,19]],[[8275,1415],[45,-74],[57,-32],[86,22],[60,-11],[65,107],[-8,183],[104,75]],[[8684,1685],[71,33],[75,0],[7,-97],[-10,-140],[25,-11],[39,65],[64,0],[154,-161],[64,-33],[36,-10],[-4,118],[18,21],[36,-53],[61,-54],[48,-82]],[[9828,3465],[4,-40],[11,-37],[72,-153],[11,-34],[5,-45]],[[9931,3156],[-69,-20],[-67,0],[-65,65],[-60,-22],[17,-118],[29,-86],[-29,-32],[-50,11],[-57,-97],[-50,-97],[-50,-43],[32,-150],[72,0],[21,96],[100,97],[54,-75],[71,-65],[36,-96],[-43,-151],[-27,-125]],[[9796,2248],[-7,-21],[-5,1],[-7,14],[-5,17],[-6,14],[-12,5],[-11,-5],[-15,-20],[-27,-26],[-122,-82],[-20,-1],[-15,14],[-48,-20],[-20,2],[-22,14],[-15,44],[-45,-3],[-48,17],[-30,29],[-28,53],[-20,23],[-27,63]],[[9241,2380],[22,29],[12,11],[11,22],[-2,12],[-6,11],[-11,9],[0,56],[40,92],[-6,53],[-17,45],[-12,43],[-4,62],[3,30],[1,25],[-27,47],[-42,28],[-25,57],[3,36],[-5,25],[2,56],[-20,0],[-7,-8],[-8,1],[-8,12],[2,11],[-4,16],[-11,22],[-14,38],[-16,60],[-1,30],[-13,59],[-56,-77],[-17,74],[-2,42],[-11,48],[-2,39],[1,25],[10,24],[18,30],[25,5],[19,10],[17,15],[21,27],[11,63],[-18,79]],[[9094,3774],[58,-3],[75,-33],[46,0],[47,-139],[42,-54],[29,86],[50,43],[71,-97],[29,-129],[46,-64],[36,86],[61,86],[89,-22],[55,-69]],[[8789,4633],[88,8],[71,-54],[22,-129],[21,-196],[-9,-52],[-13,-28],[2,-45],[6,-20],[16,-22],[19,11],[15,-4],[17,-13],[23,-28],[14,-34],[39,-72]],[[9120,3955],[-26,-82],[0,-99]],[[9241,2380],[-22,40],[-115,-31],[-23,13],[-5,11],[-18,54],[-10,-16],[-6,-38],[-20,-29],[-28,-25],[-30,-7],[-27,-15],[-9,-26],[10,-59],[-38,5],[-12,-14],[-100,13],[-60,-30]],[[8728,2226],[-169,22],[-15,10],[-16,-10],[-35,-52],[-32,-28],[-4,-11],[-2,-19],[0,-10],[5,-36],[-33,0],[-32,10],[-14,11],[-9,18]],[[8372,2131],[-4,27],[1,47],[-2,40],[-7,32],[-18,36],[-20,27],[-6,33],[-12,39],[-3,64],[-37,86],[-14,57],[-4,27],[-3,36],[9,28],[34,2],[22,47],[-34,115],[-21,56],[-74,161],[3,29],[14,28],[6,34],[15,59]],[[8217,3241],[92,14],[57,-11],[11,75],[-47,237],[-3,161],[-32,129],[-93,32],[-43,151],[-43,86],[-61,32],[-49,63]],[[8006,4210],[14,110],[172,459],[29,55]],[[8788,3355],[22,83],[8,106],[6,76],[-2,68],[-33,23],[-41,-31],[-50,-157],[15,-107],[75,-61]],[[2100,4918],[-39,-191],[-28,-142],[25,-143],[38,-57],[12,-161],[7,-190],[47,-76],[19,-171],[35,-47],[41,133],[69,19],[54,-67],[25,-95]],[[2405,3730],[-15,-299],[55,-74],[5,-31],[5,-51],[-8,-27],[-8,-23],[-14,-80],[56,-11],[26,-14],[49,-65],[51,-23],[2,-1]],[[2609,3031],[-51,-59],[-195,-135],[-21,-5],[-24,17],[-61,108],[-37,33],[-3,3],[-88,34],[-410,-23],[-27,18],[-51,64],[-26,23],[-62,7],[-153,-121]],[[1400,2995],[-1,2],[-3,7],[-48,109],[8,18],[14,22],[21,11],[15,15],[10,28],[-8,28],[-48,102],[4,42],[-5,29],[4,24],[14,54]],[[1377,3486],[43,-3],[16,9],[20,-2],[18,-14],[26,20],[2,59],[-12,24],[-42,57],[-9,20],[-1,31],[68,40],[55,16],[29,33],[7,24],[-4,23],[-7,19],[-4,48],[-4,24],[-5,17],[4,50],[-1,87],[-10,109],[12,41],[18,30],[42,43],[15,32],[10,33],[9,52],[11,29],[1,26],[-5,26],[-16,74],[-16,121]],[[1647,4684],[58,1],[35,57],[29,58],[26,28],[50,37],[14,21],[35,16],[1,69],[-18,44],[-12,23],[-14,14],[-9,3],[-12,-5],[-10,-1],[-25,21],[-8,25],[5,19],[28,30],[3,17],[20,41],[33,-12],[10,-16],[4,-21],[-1,-16],[15,-32],[60,-44],[35,14],[20,39],[15,20],[16,57]],[[2050,5191],[52,12],[27,-11],[20,-19],[4,-17],[-7,-15],[-5,-20],[1,-65],[-3,-33],[-6,-20],[-11,-18],[-9,-19],[-13,-48]],[[9278,7015],[-8,-99],[-10,-24],[-13,-28],[-14,-7],[-13,-20],[-72,-66],[-18,-63],[-22,-23],[-22,-75],[-39,4],[-11,-2],[-24,22],[-20,38]],[[8536,6475],[-139,93],[-14,6],[1,13],[3,13],[16,28],[9,23],[-9,16],[-54,58],[-45,74],[-114,-3],[-56,-17],[-22,65],[-5,3],[-8,1],[-5,-4],[-63,13],[-41,13],[-18,-11],[-46,-52],[-44,57],[-2,15],[-5,44],[-61,66],[-21,51],[-33,120]],[[7760,7160],[28,116],[41,-9],[60,0],[22,28],[16,171],[9,104],[50,56],[69,0],[0,67],[-3,142],[-14,72]],[[8038,7907],[29,41],[16,58],[14,61],[22,53],[25,19],[17,-21],[16,-30],[21,-6],[24,9],[24,-1],[48,-27],[32,-41],[51,-127],[28,-53],[33,-26],[110,-11],[213,-127],[46,48],[241,3],[-7,-151],[4,-98],[-15,-85],[-5,-73],[35,-61],[144,-111],[74,-135]],[[7425,7944],[2,-17],[6,-23],[-7,-40],[-9,-38],[-2,-39],[-4,-19],[4,-19],[8,-15],[6,-28],[12,-13],[0,-17],[-2,-12],[-69,-56]],[[7370,7608],[-14,118],[-26,-10],[-51,-10],[-7,81],[-77,20],[-41,0],[-43,91],[-41,-40],[-60,0],[-102,-41],[-43,-81]],[[6865,7736],[-68,0],[-10,81],[20,81],[-3,81],[-34,61],[78,21],[37,50],[27,122],[13,91],[-178,51],[-4,81],[-40,10],[27,193],[-155,-91],[-64,30]],[[6511,8598],[-39,52],[-60,32],[-28,65],[-44,38],[-16,40]],[[6324,8825],[3,30],[7,33],[-7,35],[-18,19],[-22,39],[-21,46],[-62,78],[5,58],[43,-23],[29,3],[18,23],[16,10],[14,13],[13,-1],[11,4],[12,10],[42,-71],[55,-10],[6,62],[4,58],[8,90]],[[6480,9331],[52,29],[15,9],[21,-1],[21,-58],[13,-84],[18,-83],[34,-54],[290,-41],[16,-14],[11,-20],[4,-39],[-5,-25],[-7,-25],[-5,-38],[5,-86],[12,-51],[152,-206],[46,-86],[130,-345],[47,-90],[58,-67],[17,-12]],[[4707,3582],[27,-82],[37,-67],[15,-81],[49,37],[54,-119],[25,-186],[-22,-51],[-94,-67],[7,-60],[74,-22],[-19,-74],[-33,-52],[18,-89],[66,52],[61,-52]],[[4972,2669],[-21,-47],[-26,-45],[-79,-78],[-47,-35],[-46,21],[-88,108],[-44,29],[-43,-12],[-166,-146],[-37,-12],[-2,0],[-42,13],[-46,44],[-129,171]],[[4156,2680],[38,41],[37,37],[7,82],[44,51],[-7,82],[32,0],[49,-59],[40,74],[-57,59],[-69,60],[-37,44],[-2,89],[-8,127],[-17,100]],[[4206,3467],[19,-1],[16,5],[52,102],[-3,33]],[[4290,3606],[37,-24],[61,-22],[33,-30],[29,-30],[54,-37],[25,74],[67,67],[61,8],[50,-30]],[[6334,6459],[21,-78],[-4,-137],[-13,-97]],[[6338,6147],[-43,39],[-32,0],[-18,-20],[-52,20],[-19,58],[-45,65],[-43,7],[-22,71],[6,59],[-13,52],[-58,0],[2,111],[-43,91],[-78,65]],[[5880,6765],[0,143]],[[5880,6908],[33,-20],[26,-32],[51,-20],[18,-19],[-18,-52],[29,-20],[43,20],[43,26],[45,-52],[54,-52],[33,-59],[15,-59],[0,-136],[30,-33],[32,20],[20,39]],[[7834,1944],[55,-40],[18,-28],[25,-31],[40,-1],[37,17],[45,50],[22,9],[19,0],[15,-23],[34,14],[22,7]],[[8166,1918],[3,-99],[56,-193],[52,7],[-23,-80],[2,-28],[6,-30],[16,-56],[-3,-24]],[[8291,661],[-29,-32],[-80,-165],[-79,-247],[-28,-55],[-110,-96],[-31,-4],[-74,50],[-37,7],[-33,-32],[-29,-87],[-79,11],[-78,36],[-191,158],[-87,112],[-73,223]],[[7253,540],[44,33],[46,7],[79,13],[-18,124],[-82,172],[59,110],[-22,41],[-23,27],[7,69],[36,41],[27,62],[48,-48],[29,99],[-23,83],[-15,100],[5,91],[-17,49],[-12,74],[-4,84]],[[7417,1771],[-4,60],[-3,109],[-5,63],[-12,55],[-38,86]],[[7355,2144],[48,27]],[[7403,2171],[63,29],[49,-55],[54,-13],[40,-53],[32,-147],[45,7],[5,34],[17,60],[20,-11],[7,-25],[46,-65],[16,-30],[5,-16],[32,58]],[[7687,1080],[-96,25],[-46,-77],[15,-37],[51,-53],[2,-100],[4,-65],[19,-52],[20,-58],[19,23],[33,23],[35,12],[21,52],[7,85],[20,31],[11,32],[10,36],[-28,27],[7,81],[-6,94],[-3,52],[-21,14],[-74,-145]],[[3375,3431],[-30,106],[-15,112],[-36,0],[-57,-134],[-57,-96],[20,-90],[29,-37],[-46,-22],[-84,0],[-60,-15],[-32,-74]],[[3007,3181],[-27,52],[-10,104],[-44,37],[-5,186],[3,89],[-30,22],[-35,111],[-27,52],[-56,-52],[-28,97],[-49,-52],[8,-82],[-47,-7],[-47,-60],[-20,-59],[-20,7],[-14,89],[-35,28]],[[2524,3743],[-9,44],[-4,10],[-6,18],[-8,8],[-2,17],[-1,20],[1,20],[5,19],[17,5],[33,1],[17,13],[16,27],[18,57],[7,56],[-30,59],[-12,54],[-32,28],[-8,74],[36,8]],[[2562,4281],[68,46],[39,11],[114,-4],[59,-66],[76,-18],[21,4],[33,30]],[[2972,4284],[67,-26],[30,52],[31,25],[78,-3],[38,21],[35,142],[-14,66],[1,36],[8,33],[74,78],[19,-29],[11,-7],[16,1],[59,29],[48,69]],[[3473,4771],[26,-32],[28,-185],[-31,-70],[-60,-51],[-32,-45],[-26,-70],[35,-42],[28,-18],[21,-32],[4,-18],[-2,-15],[6,-49],[2,-20],[-13,-17],[-44,-60],[-8,-30],[-19,-51],[-16,-25],[-10,-40],[103,-29],[-5,-52],[-39,-33],[-16,-8],[-7,-26],[3,-28],[16,-32],[18,-48],[1,-62],[-17,-101],[-13,-26],[-31,-25]],[[8331,6010],[-18,-39],[-22,-39],[-36,-128],[-32,-62],[-38,-44],[-58,-88],[11,-51],[4,-13],[-15,-82]],[[8127,5464],[-89,26],[-19,14],[-33,2],[-32,-20],[-12,-23],[-31,-35],[-9,-3],[-8,19],[-77,-54],[-44,-48],[-49,-21]],[[7724,5321],[-12,126],[-21,126],[-15,67],[-28,78],[-22,49],[-48,22],[-128,-69]],[[7450,5720],[-56,113],[-10,108],[-69,-44],[-78,8],[-44,-27]],[[7193,5878],[-91,-19]],[[7102,5859],[22,79],[9,47],[30,85],[6,22],[3,38],[-50,119],[-40,122],[-18,35],[-19,20],[-19,11],[-67,16]],[[6959,6453],[-13,94],[6,12],[8,13],[48,1],[13,5],[0,58]],[[7021,6636],[24,37],[35,17],[40,-7],[182,22],[6,29],[-2,50],[15,31],[6,40],[-4,21],[-2,33]],[[7321,6909],[115,-35],[89,40],[9,31],[0,27],[-8,4],[-18,-18],[-10,-2],[-7,7],[-6,13],[-1,15],[4,15],[33,15],[17,14],[19,33],[38,24],[7,31],[1,20],[-6,74],[61,6],[8,-20],[7,-12],[18,-13],[33,7],[36,-25]],[[3864,4705],[-14,-117],[6,-15],[-11,-101]],[[3845,4472],[-76,-29],[0,-67],[-41,-22],[17,-74],[37,37],[29,-67]],[[3811,4250],[-66,-68],[-54,16],[-36,-35],[18,-80],[63,-85],[-8,-118],[50,-40],[44,66],[54,41],[-12,79],[31,43]],[[3895,4069],[50,-79],[51,-52],[64,-30],[40,-118],[32,-104],[7,-149],[32,-68]],[[4171,3469],[-41,-19],[-17,-41],[-25,-22],[-17,-41],[-47,-28],[-15,-13],[-18,-60],[-20,-40],[-9,-20],[0,-15],[3,-13],[10,-16],[0,-21],[-3,-28],[-7,-41],[-6,-20],[-3,-15],[0,-23],[52,7],[7,-22],[-8,-43],[-4,-28],[-3,-99],[4,-45],[0,-1]],[[4004,2762],[-18,9],[-46,2],[-95,-37],[-43,12],[-2,14],[2,26],[-2,31],[-11,28],[-12,7],[-38,-10],[-96,8],[-44,-22],[-83,-83],[-50,6],[-142,102]],[[3324,2855],[0,1],[9,25],[49,62],[14,9],[16,17],[11,18],[9,22],[8,26],[0,38],[-18,61],[-14,62],[-11,35],[-17,18],[-8,41],[3,9],[15,31],[2,16],[4,20],[-21,65]],[[3473,4771],[-34,283],[62,43]],[[3501,5097],[112,-14],[18,-8],[35,0],[60,-60],[52,-94],[15,-67],[22,-58],[49,-91]],[[6770,3439],[9,-81],[-52,9],[-34,37]],[[6693,3404],[8,168]],[[6701,3572],[38,35],[34,0],[15,-55],[40,28],[9,-65],[-67,-76]],[[5397,8129],[-1,-174],[20,-65],[29,-47],[24,2],[70,31],[28,-7],[25,-28],[33,-83],[7,-45],[0,-26],[-6,-11],[1,-7],[8,-9],[18,4],[20,-8],[8,-15],[1,-15],[-11,-14]],[[5671,7612],[-25,-8],[-12,-27],[-10,-37],[-46,-28],[-13,-36],[-19,-26],[-12,-35],[-129,-133],[-15,-32],[-40,-4],[-47,29],[-19,-8],[1,-24],[44,-66]],[[5329,7177],[-112,5],[-4,57],[-82,-86],[19,-168],[-25,-86],[-65,-35],[15,-81],[52,-58],[29,-184],[9,-63],[-43,-17]],[[5122,6461],[-53,59],[-29,118],[-29,55],[-17,27],[-15,14],[-4,9],[-2,20],[-10,59],[-23,26],[-107,-94],[-15,5]],[[4818,6759],[-15,4],[-31,-18],[-2,13],[-1,18],[6,39],[3,49],[-4,35],[-5,23],[-21,44],[-8,13],[0,1]],[[4740,6980],[-14,216]],[[4726,7196],[73,32],[54,34],[21,47],[13,86],[65,18],[27,52],[-17,40],[-23,63],[-27,133],[33,81],[-87,12],[10,46],[-27,52],[-25,-12],[-36,12],[2,86],[-16,6],[4,127],[-11,208],[134,35],[34,-52],[33,29],[-8,63],[6,121],[63,-11],[-13,156],[69,75]],[[5077,8735],[60,-41],[21,-46],[55,-75],[71,6],[41,-58],[-6,-81],[9,-138],[85,-58],[-16,-115]],[[7193,5878],[5,-102],[-15,-97],[2,-117],[13,-91],[-20,-78],[-2,-52],[15,0],[26,-7],[30,-97],[29,6],[34,7],[26,39],[54,-39],[45,0],[-8,71],[30,33],[26,58],[17,78],[-30,65],[-11,111],[-9,54]],[[7724,5321],[-131,-390],[43,-91],[17,-32],[-6,-52],[32,-46],[35,33],[24,-20],[43,59],[15,58],[73,143],[9,72],[45,78],[20,-52],[101,19],[52,20],[33,0],[30,-59],[2,-52],[35,0],[32,-32],[27,-79]],[[8006,4210],[-39,65],[-46,45],[-4,65],[-35,-6],[-47,-20],[-30,-52],[-26,-58],[-43,6],[-57,-58],[-203,0],[-17,-174]],[[7459,4023],[-35,-108],[-11,-25],[-71,-71],[-10,79],[-4,21],[-26,24],[-52,-28],[-36,72],[9,33],[-19,30],[-29,11],[-19,21],[-35,16],[-53,-42],[-47,-58],[-25,-14],[-24,12],[-29,43],[-25,108],[-71,-116]],[[6847,4031],[-3,50],[-7,18],[-12,20],[-3,24],[2,17],[16,11],[8,18],[4,24],[-40,65],[-100,62],[-12,119],[2,35],[14,30],[9,33],[10,24],[-11,79],[-21,48],[-22,4],[-8,12],[-12,30],[-16,28],[-28,39]],[[6617,4821],[-11,97],[-13,65],[28,52],[9,46],[45,19],[39,20],[32,26],[44,-26],[34,26],[43,0],[9,78],[-13,32],[-32,46],[-47,84]],[[6784,5386],[43,46],[4,28],[4,46],[-5,29],[-12,28],[-10,30],[-11,51],[1,47],[4,52],[9,47],[2,36],[21,113]],[[6834,5939],[37,13],[101,-87],[21,-11],[15,0],[5,14],[5,17],[12,18],[17,-2],[17,-9],[38,-33]],[[6258,4759],[-94,-158],[-63,-57],[-19,-5],[-17,11],[-16,-1],[0,-13],[3,-25],[-41,19],[-43,-14],[-37,-39],[-15,-38],[49,-53],[7,-17],[-2,-12],[-1,-14],[-24,-67]],[[5945,4276],[-84,47],[-3,-12],[-20,-31],[-34,23]],[[5804,4303],[-31,22],[-6,25],[-72,94]],[[5695,4444],[-31,69],[-21,65],[-25,83],[-49,19],[-52,18],[-34,46],[-27,-37]],[[5456,4707],[-53,56],[-58,55],[-37,28],[-15,-111],[-37,-28],[6,-83],[-31,-92],[-50,-91],[-28,68],[-9,16],[-26,14],[-25,13],[-11,18],[-10,23],[-28,41],[-9,8],[-31,89],[-12,24]],[[4992,4755],[40,52],[69,118],[47,-59],[49,111],[-46,38],[-13,86]],[[5138,5101],[31,7],[31,51],[30,23],[65,78]],[[5295,5260],[46,-32],[51,-19],[18,5],[39,49],[27,19],[23,6],[30,-21],[32,17],[50,-23],[147,70]],[[5758,5331],[126,-69],[24,2],[-4,10],[-3,10],[1,13],[14,19],[6,23],[18,24],[13,26],[60,51],[22,1],[15,-16],[10,-28],[7,-30],[5,-27],[2,-21],[0,-27],[33,-17],[43,47],[35,87],[-3,32],[-4,19],[-1,40],[31,-13],[5,2],[21,23]],[[6234,5512],[7,-55],[20,-35],[1,-35],[12,-34],[8,-53],[12,-45],[1,-46],[-11,-33],[-7,-24],[-4,-19],[0,-22],[6,-15],[10,-18],[9,-21],[30,-46],[-100,-28],[2,-42],[-1,-13],[11,-32],[12,-17],[5,-37],[3,-27],[-2,-56]],[[7834,1944],[-41,61],[-20,69],[60,-8],[34,51],[3,172],[-20,172],[-26,68],[-54,26]],[[7770,2555],[-14,155],[-29,8],[-77,52],[-74,103],[25,137],[86,-69],[49,241]],[[7736,3182],[20,51],[45,17],[86,-85],[65,-138],[-31,-51],[-57,-60],[-26,-138],[20,-60],[52,-34],[54,-95],[57,-34],[43,-120],[34,-163],[-6,-60],[-46,-61],[35,-34],[48,-60],[29,-43],[8,-96]],[[2795,7245],[51,-72]],[[2846,7173],[-34,-111],[-54,-66],[-66,-76],[47,-152],[89,-29],[50,-28],[9,-104],[26,-82]],[[2913,6525],[-56,-117],[-86,-96],[-14,-15],[-25,-65],[-3,-31],[-8,-33],[-14,-33]],[[2707,6135],[-27,-31],[-111,12],[-32,-14],[-8,-22],[-12,-22],[-45,-57],[-126,-60],[-38,-13],[11,-220],[-19,-107],[-61,27],[-44,-58],[-71,22]],[[2124,5592],[-39,17],[-93,-13],[-42,21],[-13,66],[-14,28],[-4,38],[-1,20],[5,93],[-12,99],[-7,31],[-29,43],[-41,35],[-49,67],[-18,43],[-11,47],[-10,16],[-39,30]],[[1707,6273],[-3,54],[-19,19],[-3,14],[8,57],[54,128],[56,90],[33,26],[6,22],[3,41],[7,10],[-19,136],[-13,53],[0,70],[-5,125],[-8,25],[-23,44]],[[1781,7187],[31,122],[60,28],[31,-94],[45,0],[60,38],[72,-29],[38,199],[60,152],[107,19]],[[2285,7622],[95,-85],[-22,-105],[37,-85],[51,95],[113,-209],[32,-85],[66,-57],[54,9],[22,105],[62,40]],[[3460,5271],[21,-8]],[[3481,5263],[20,-166]],[[2972,4284],[-41,92],[-32,163],[-20,142],[-27,51],[-84,-22],[-59,37],[-12,97],[27,89]],[[2724,4933],[-27,82],[-8,59],[-2,111],[-59,37],[-60,104],[-17,104],[17,134],[45,15],[22,37],[-17,74],[-15,82],[-20,89],[77,44],[22,60],[39,44],[20,52],[-34,74]],[[2913,6525],[45,111]],[[2958,6636],[22,-92],[5,-141],[-17,-156],[-27,-67],[17,-74],[52,-60],[74,-74],[37,-163],[-25,-111],[-49,-112],[-12,-111],[39,-74],[-27,-52],[-49,-82],[9,-59],[72,37],[106,-60],[131,-22],[96,67],[48,41]],[[6191,7766],[-6,-91],[-28,-39],[-50,13],[-26,0]],[[6081,7649],[-6,78],[8,91]],[[6083,7818],[46,26],[39,0],[23,-78]],[[4406,5754],[26,-20],[59,-109],[35,-38],[34,-26],[19,-27],[20,-37],[24,-91]],[[4623,5406],[-29,-56],[-56,-39],[-16,-21],[-17,-44]],[[4505,5246],[3,-109],[30,-129],[-85,37]],[[4453,5045],[-57,85],[-31,-17],[-29,-24],[-11,-37],[-6,-22],[-16,-9]],[[4303,5021],[-24,-16],[-6,57]],[[4273,5062],[-6,51],[-30,48],[-19,40],[-33,17],[-43,40],[-40,22]],[[4102,5280],[9,34],[55,74],[8,35],[9,26],[-11,22],[-35,13],[-18,15]],[[4119,5499],[-28,23],[-8,37],[-1,4]],[[4082,5563],[35,27],[52,75],[25,59],[18,56],[19,41],[53,25],[54,57]],[[4338,5903],[53,-137],[15,-12]],[[51,3234],[0,82],[7,42],[-10,70],[-4,75],[8,39],[25,-40],[8,-43],[8,-108]],[[93,3351],[-17,-11],[-2,-60],[-4,-41],[-19,-5]],[[116,3505],[-6,19],[-25,35],[-15,12],[-12,3],[-10,9],[-10,33],[-5,46],[4,18],[7,18],[14,171],[14,67]],[[72,3936],[64,-38],[14,-178],[23,24],[13,-149],[-42,-40],[-28,-50]],[[3811,4250],[86,-38],[19,-113],[-21,-30]],[[749,7107],[9,37],[98,213],[45,143]],[[901,7500],[15,-28],[13,-40],[45,-233],[-73,-47],[6,-145],[-47,26],[-36,-77],[-33,-5],[-20,71],[-22,85]],[[2124,5592],[-50,-130],[-22,-175],[-15,-7],[13,-89]],[[1647,4684],[-68,52],[-29,67],[-85,0],[-66,-10],[-66,-95],[34,-275],[-41,-57],[-60,10],[-63,-67],[-24,-70]],[[1179,4239],[-30,11],[-35,34],[-12,25],[6,34],[-2,42],[-10,37],[-3,38],[-31,96],[-81,113],[-8,-4],[-31,-2],[-10,5],[-20,36],[-10,48],[-17,47],[-2,42],[-22,51],[-36,-12],[-56,-1],[-14,8],[-32,86],[-78,12]],[[645,4985],[44,47],[8,36],[27,67]],[[724,5135],[35,29],[63,0],[28,85],[76,10],[35,66],[56,28],[-19,171],[-50,48],[-32,104],[10,57],[-47,57],[-44,100]],[[835,5890],[26,7],[46,70],[21,42],[17,8],[14,1],[39,-9],[27,11],[76,-41],[31,-12],[1,-18],[-1,-19],[-8,-41],[53,0],[25,32],[14,23],[14,3],[105,-8],[21,5],[62,37],[26,26],[83,-49],[27,-1],[107,62],[27,33],[3,15],[1,16],[0,71],[1,18],[1,17],[4,36],[9,48]],[[724,5135],[-64,35],[-57,47],[-12,25],[-8,21],[6,33]],[[589,5296],[70,30],[11,44],[24,46],[4,63],[-1,110],[15,64],[6,94],[19,30],[5,72],[45,-21],[48,62]],[[2511,4721],[-2,-30],[46,-105],[8,-157],[3,-32],[-6,-26],[-8,-8],[-6,-10],[1,-18],[5,-12],[10,-42]],[[2524,3743],[-34,-4],[-26,-23],[-26,15],[-5,-1],[-28,0]],[[2100,4918],[51,-41],[81,-18],[66,-54],[16,-33],[-6,-33],[51,5],[55,-31],[97,8]],[[1377,3486],[-14,32],[-50,-30],[-11,4],[-3,17],[-3,22],[-5,17],[-15,6],[-38,-10],[-21,3],[-25,11],[-20,29],[-15,31],[-19,67],[3,78]],[[1141,3763],[-3,42],[2,22],[-6,35],[-18,54],[-1,15],[36,38],[15,28],[9,40],[5,33],[-12,61],[-8,31],[19,77]],[[1400,2995],[-25,-19],[-316,-249]],[[1059,2727],[-15,134],[35,53],[0,53],[-38,0],[-30,62],[-50,88],[27,62],[-6,133],[73,36],[0,106],[-35,26],[6,186]],[[1026,3666],[56,53],[59,44]],[[1026,3666],[-70,44],[-106,-44],[-18,44]],[[832,3710],[65,116],[0,106],[-15,124],[-50,62],[-74,-27],[-38,0],[-53,-26],[-29,115],[-38,-9],[-6,88],[-86,107],[-29,88]],[[479,4454],[12,80],[-6,203],[35,53],[88,45],[42,35],[-5,115]],[[1059,2727],[-71,-57],[-123,-9],[-51,-44],[-101,-131]],[[713,2486],[-46,153],[-100,107]],[[567,2746],[50,106],[30,221],[-71,239],[-3,106],[-41,53]],[[532,3471],[74,71],[-12,160],[47,-54],[56,-106],[11,-35],[65,9],[-41,159],[41,80],[59,-45]],[[400,4109],[32,-186],[-38,-97],[3,-239],[126,53],[9,-169]],[[567,2746],[-161,-9],[-50,106]],[[356,2843],[-21,336],[-88,-9],[-27,284],[-89,-20]],[[131,3434],[-7,40],[-8,31]],[[72,3936],[35,171]],[[107,4107],[16,-51],[88,-36],[45,195],[79,-150],[65,44]],[[356,2843],[-65,18],[6,-133],[-6,-151],[-21,-97],[-76,-186],[-33,35],[-2,-150],[0,-106],[-39,9],[-29,407],[-88,-28]],[[3,2461],[13,81],[3,48],[0,44],[-1,38],[-15,163],[-3,83],[3,80],[11,64],[19,56],[8,32],[7,38],[3,46]],[[93,3351],[12,-50],[-20,-56],[10,-16],[10,-10],[0,-59],[0,-29],[-20,-54],[32,-75],[12,-12],[11,9],[10,25],[3,32],[-15,87],[-3,74],[2,71],[6,44],[-6,29],[-6,73]],[[713,2486],[-91,-118],[-22,-12],[-62,-5],[-43,-37],[-51,-72],[-49,-90],[-35,-92],[-23,-133],[-10,-115],[-21,-79],[-56,-26],[-81,-1],[-52,-22],[0,2],[-1,19],[-14,153],[-19,137],[-62,261],[-14,90],[-6,89],[2,26]],[[479,4454],[-32,71],[-44,-71],[17,-133],[21,-106],[-41,-106]],[[107,4107],[17,135],[9,356],[-5,82],[-10,74],[-2,71],[17,72],[113,125],[14,38],[91,92],[25,44],[50,128],[14,26],[17,17],[39,58]],[[496,5425],[5,0],[43,-28],[30,-43],[15,-58]],[[2233,8296],[-27,38],[3,-237],[54,-161],[3,-152],[19,-162]],[[1781,7187],[-20,38],[-81,-23],[-48,13],[-102,77],[83,60],[40,56],[15,33],[-1,25],[-4,28],[21,19],[20,31],[94,97],[3,42],[-3,132],[-5,26],[-13,37],[-12,49],[-7,51],[3,46],[-16,84],[-17,14],[-15,-9],[-9,25],[-16,127]],[[1691,8265],[399,353],[59,30],[31,4],[16,8],[17,17],[18,12],[20,-7],[14,-14],[-1,-5],[-7,-10],[-6,-30],[-13,-156],[-5,-171]],[[2233,8296],[5,-84],[13,-61],[77,-184],[307,-434],[99,-201],[61,-87]],[[3023,6858],[-44,-26],[-10,-30],[-9,-49],[-2,-117]],[[2846,7173],[71,-68],[47,-18],[18,-13],[4,-32],[0,-41],[7,-41],[30,-102]],[[5966,3076],[6,-128],[1,-47],[5,-68],[-6,-28],[-2,-23],[4,-12],[8,-14],[78,17],[12,-31],[-10,-20],[-29,-23],[-25,-32],[-18,-48],[-1,-43],[38,-48],[26,-59],[21,-24],[44,-101],[-11,-122],[17,-82],[1,-16],[-7,-13],[-44,-5],[-17,-25],[-14,-33],[0,-1]],[[6043,2047],[-331,96],[-50,61],[-40,125],[-25,134],[-13,40],[-46,86],[-14,42],[-15,77],[-36,252],[-36,175],[-25,69],[-29,16]],[[5383,3220],[9,50],[32,22],[15,52],[12,60],[129,37]],[[5580,3441],[19,-149],[32,15],[33,-252],[81,44],[221,-23]],[[7063,3070],[28,-2],[49,-69],[17,-37],[5,-34],[3,-37],[1,-86],[5,-22],[19,-68],[5,-22],[-2,-81],[2,-21],[3,-10],[7,-13],[6,-9],[2,3],[0,-34],[-3,-29],[-4,-26],[-2,-22],[-3,-94],[6,-36],[21,-14],[15,-4],[27,-17],[15,-4],[20,-24],[50,-114]],[[7417,1771],[-40,121],[-2,34],[5,17],[3,27],[-5,19],[-6,18],[-11,13],[-31,23],[-35,13],[-19,20],[-33,-4],[-19,-10],[-92,-135],[17,-42],[3,-11],[-1,-38],[-32,-45],[-12,10],[-17,3],[-15,-23],[-7,-26],[-18,-45],[-28,-46],[-18,-6],[-13,9],[-15,45]],[[6976,1712],[-19,121],[-37,9],[-12,74],[0,83],[-40,37],[-58,55],[-12,130],[-28,83],[-52,19],[-52,37],[-62,-19],[-86,-9]],[[6518,2332],[-18,268],[73,28],[3,120],[-3,92]],[[6573,2840],[83,37],[68,222],[-46,129],[15,176]],[[6770,3439],[68,-48],[162,-114],[17,-20],[12,-60],[22,-79],[12,-48]],[[7459,4023],[35,-8],[115,-116],[52,-26],[98,-19],[-14,-131],[5,-51],[12,-18],[18,-10],[26,-4]],[[7806,3640],[-45,-154],[-2,-21],[0,-20],[5,-5],[0,-4],[-1,-24],[-51,-11],[-26,15]],[[7686,3416],[-16,16],[-41,10],[-33,-8],[-24,-21],[-17,-26],[-13,-28],[-33,-44],[-68,-60],[-13,98],[-42,98],[-3,36],[-7,21],[-9,16],[-26,9],[-46,-24],[-33,-55],[-46,-107],[-12,-63],[-52,-119],[-89,-95]],[[6701,3572],[-37,2],[-18,11],[-24,99],[-29,50],[11,107],[1,84]],[[6605,3925],[43,-12],[59,16],[72,43],[68,59]],[[6573,2840],[-9,74],[-70,-9],[-25,111],[-31,64],[-33,93],[6,65],[-30,84]],[[6381,3322],[-20,89],[-19,41],[-10,51],[24,121],[31,50],[10,42],[2,24],[-11,11],[-27,-5],[-27,19],[13,12]],[[6347,3777],[13,-1],[31,10],[62,73],[58,18],[31,21],[45,48],[18,-21]],[[6347,3777],[-84,9],[-21,43],[7,55],[-4,39]],[[6245,3923],[34,8],[15,120],[71,139],[-19,148],[65,18],[0,93],[-28,55],[6,55],[37,-9],[40,-37],[50,69]],[[6516,4582],[52,49],[6,29],[17,49],[3,32],[-1,24],[-12,16],[10,31],[26,9]],[[6245,3923],[-12,7],[-31,-2],[-57,59],[-34,15],[-44,-68],[-51,-70],[-50,-27]],[[5966,3837],[-1,168],[0,185],[-20,86]],[[6258,4759],[78,-44],[60,0],[50,-43],[38,-13],[32,-77]],[[5966,3837],[-80,-23],[-28,14],[-36,50],[-36,50],[-34,26]],[[5752,3954],[57,88],[3,83],[-19,83],[11,95]],[[5752,3954],[-28,21],[-52,-12],[-43,-39]],[[5629,3924],[-41,-16],[10,49],[-3,19]],[[5595,3976],[-5,31],[-8,37],[3,128],[-1,40],[4,26],[7,12],[11,9],[13,6],[18,30],[-2,20],[-10,8],[-6,21],[-8,15],[1,16],[-11,27],[94,42]],[[6381,3322],[-5,-26],[-10,-9],[-13,-24],[-10,-22],[-26,-11],[-34,0],[-25,-35],[-40,-73],[-29,-23],[-85,-10],[-86,43],[-48,-2],[-4,-54]],[[5580,3441],[-25,230],[-54,0],[-9,114]],[[5492,3785],[26,12],[101,36],[20,47],[-10,44]],[[6518,2332],[0,-83],[-28,-102],[-33,-167]],[[6457,1980],[-82,-11],[-24,8],[-69,56],[-94,-29],[-145,43]],[[6976,1712],[-25,33],[-25,-28],[-10,-19],[-38,-54],[-18,-5],[-21,37],[-14,39],[-117,178],[4,-55],[5,-22],[18,-47],[4,-18],[8,-28],[-15,-29],[-6,-40],[-10,-30],[-37,-41],[-20,-33],[-1,-1]],[[6658,1549],[-40,77],[-79,93],[-17,29],[-12,43],[-26,140],[-10,36],[-17,13]],[[5383,3220],[-19,-30],[-5,-44],[-2,-46],[-9,-36],[-11,-4],[-30,20],[-14,-1],[-125,-93],[-50,-37],[-55,-72],[-91,-208]],[[4707,3582],[9,96],[-54,52],[-37,-7],[-17,200],[81,30],[-17,177]],[[4672,4130],[26,-9],[-2,28],[4,9],[11,10],[43,14],[18,15],[21,27],[54,85],[55,37]],[[4902,4346],[47,-28],[62,0],[45,-125],[-61,-66],[4,-74],[10,-93],[24,-56],[17,-24],[38,-7],[7,-12],[1,-12],[-4,-14],[2,-9],[6,-5],[11,-3],[24,-20],[8,-12],[0,-11],[-21,-20],[-14,-19],[-10,-41],[-10,-55],[104,3],[300,142]],[[4290,3606],[14,64],[23,54],[7,46],[-5,23],[-17,5],[-18,1],[-36,16],[-20,27],[-20,43],[0,22],[5,4],[13,0],[13,9],[12,33],[-3,20],[-5,17],[-2,16],[1,14],[-7,11],[-13,15],[-37,72],[-4,25],[3,6],[12,-14],[8,-18],[15,4],[11,7],[-12,112]],[[4228,4240],[74,-25],[42,-45],[18,-13],[25,0],[16,8],[16,35],[2,27],[8,23],[7,8],[16,-4],[18,8],[29,25]],[[4499,4287],[21,17],[17,-10],[8,-44],[16,-27],[27,-36],[57,-49],[27,-8]],[[4177,4416],[2,-37],[14,-48]],[[4193,4331],[-10,-60],[45,-31]],[[4206,3467],[-35,2]],[[3845,4472],[16,-25],[23,-25],[23,-10],[14,12],[10,13],[14,11],[100,32],[16,-2],[10,-14],[7,-33],[14,-12],[9,-11],[76,8]],[[4156,2680],[-152,82]],[[3324,2855],[-93,66],[-31,11],[-160,-63]],[[3040,2869],[-28,134],[-47,81],[42,97]],[[3040,2869],[-25,-27],[12,-43],[-69,-125],[-70,-28],[-63,81],[-49,205],[-33,120],[-45,42],[-49,-15],[-40,-48]],[[8299,5029],[-19,53],[-12,93],[-12,31],[-41,45],[-17,32],[-1,35],[5,42],[4,48],[-8,18],[-13,17],[-33,2],[-12,-9],[-13,28]],[[9349,5665],[-77,-35],[-73,-19]],[[9278,7015],[18,-35],[140,-142],[26,-37],[17,-59],[8,-97],[-7,-233],[-10,-128],[-13,-89],[-42,-65],[-128,-102],[-26,-63],[19,-75],[36,-31],[32,-42],[7,-106],[-6,-46]],[[9209,4878],[-10,-22],[-31,35],[-19,31],[-27,22],[-13,25],[-6,15],[-8,14],[-17,-16],[-27,-16],[-16,-21],[-99,-22]],[[9349,5665],[-23,-89],[-8,-46],[-4,-42],[-3,-83],[-5,-47],[-91,-324],[-28,-146],[22,-10]],[[9514,4466],[-30,3],[-32,-64],[0,-161],[-25,-97],[-57,107],[-161,-21],[-72,-129],[-17,-149]],[[9209,4878],[23,-11],[114,106],[59,27],[61,-29],[29,-41],[55,-102],[30,-40],[7,-59],[-26,-95],[-33,-98],[-14,-70]],[[9514,4466],[23,-71],[136,-160],[14,-70],[1,-187],[8,-88],[18,-68],[25,-45],[110,-89],[24,-31],[9,-49],[-10,-37],[-36,-57],[-8,-49]],[[9931,3156],[-5,-142],[4,-96],[10,-84],[56,-283],[3,-44],[-3,-61],[-8,-33],[-11,-27],[-11,-44],[-12,-98],[-8,-98],[-13,-92],[-28,-80],[-53,60],[-59,-39],[-23,-28]],[[9770,1967],[0,2],[-6,40],[-4,30],[26,100],[20,61],[-10,48]],[[9770,1967],[-38,-46],[-59,-48],[-57,-21],[-17,-15],[-22,-38],[-14,-45],[-12,-51],[-16,-55],[-94,-122],[-43,-75],[-6,-100],[-24,-70]],[[8684,1685],[-32,162],[93,53],[42,65],[-10,86],[-43,86],[-6,89]],[[8166,1918],[55,-19],[12,48],[-23,41],[16,48],[50,48],[43,7],[53,40]],[[7253,540],[-31,126],[-35,92],[-137,202],[-85,163],[-78,87],[-124,140],[-105,199]],[[7686,3416],[-5,-97],[0,-86],[32,-26],[23,-25]],[[7770,2555],[-54,-60],[-72,0],[-94,-9],[-54,69],[-31,129],[-35,-9],[-3,-154],[-82,43],[25,-241],[33,-152]],[[7806,3640],[109,10],[22,-12],[29,65]],[[7966,3703],[38,-11],[62,-67],[14,-66],[-70,-50],[35,-20],[9,-36],[18,-13],[18,-3],[19,3],[15,-12],[11,-28],[50,-28],[70,-9],[8,-66],[-12,-12],[-23,-13],[-11,-31]],[[7966,3703],[-20,81],[10,37],[19,36],[54,46],[5,14],[-6,21],[-12,25],[-3,46],[5,52],[-4,45],[-1,33],[-9,57],[2,14]],[[4695,6292],[31,-17],[42,12],[58,5],[57,-317]],[[4883,5975],[-9,-46],[-60,-93],[-71,-46],[-61,-17],[-58,-122],[-42,12],[-40,46],[-19,75]],[[4523,5784],[15,64],[10,98],[76,58],[23,63],[6,145],[10,86]],[[4663,6298],[32,-6]],[[5323,9612],[0,-7],[21,-329],[29,-3],[13,-9],[12,-21],[4,-17],[-2,-22],[3,-50],[3,-54],[8,-63],[3,-51],[8,-23],[11,-21],[23,-14],[10,1],[7,7],[5,-2],[6,-5],[10,-72],[17,34],[57,-29],[14,-20]],[[5585,8842],[83,-122],[8,-54],[21,-75],[-11,-20],[-5,-17],[-9,-24],[-6,-28],[-1,-36],[9,-38],[15,-35],[-10,-57],[11,-89]],[[5690,8247],[-37,7],[-6,-10],[1,-18],[18,-39],[10,-19],[2,-18],[-23,-14],[-9,-10],[-27,7],[-12,18],[-8,17],[-5,13],[-7,4],[-18,-9],[-8,-1],[-12,3],[-34,-34],[-44,-68],[-74,53]],[[5077,8735],[-71,416],[-32,46],[23,52],[-4,110],[-8,104]],[[4985,9463],[57,-9],[84,15],[22,28],[25,115],[20,43],[43,-18],[36,-37],[36,-10],[15,22]],[[4102,5280],[-34,-43],[-25,-59],[-59,-67],[-47,-59],[30,-149],[15,-89]],[[3982,4814],[-42,-96],[-60,74],[-16,-87]],[[3481,5263],[79,-41],[57,-7],[32,37],[34,-15],[47,0],[47,15],[84,45],[17,59],[30,-30],[86,23],[54,29],[47,45],[24,76]],[[4906,4507],[-4,-161]],[[4499,4287],[-34,59],[-24,18]],[[4441,4364],[9,94],[47,44],[35,-52],[22,30],[-10,67],[-12,96],[56,15],[72,-7],[93,-45],[72,-52],[81,-47]],[[4523,5784],[-21,52],[-96,-82]],[[4338,5903],[134,146],[12,59],[27,48],[31,33],[24,15],[0,44],[14,30],[33,39],[25,47]],[[4638,6364],[25,-66]],[[3600,5461],[-3,-7],[-105,-79],[-22,-49],[-15,-26],[3,-11],[2,-18]],[[3023,6858],[6,-21],[14,-67],[11,-82],[11,-146],[11,-76],[21,-33],[12,-39],[39,-384],[14,-64],[19,-26],[25,-16],[65,-126],[114,-76],[119,-37],[17,-24],[67,-163],[12,-17]],[[4962,5784],[-27,4],[-35,-37],[15,-208],[-111,0],[-69,-29],[-7,-112],[-34,-98]],[[4694,5304],[-27,52],[-44,50]],[[4883,5975],[8,-110],[50,17],[21,-98]],[[4992,4755],[-30,18],[-55,-9],[-18,11]],[[4889,4775],[-10,6],[-41,57],[-25,22],[-8,2],[-11,-1]],[[4794,4861],[-1,31],[6,51],[1,34],[-5,28],[-9,24],[-3,24],[5,15],[24,-3]],[[4812,5065],[17,-11],[14,-15],[8,-22],[9,-15],[11,-5],[11,11],[5,20],[-6,77],[18,15],[75,-56],[164,37]],[[5257,6096],[-19,-81],[-23,-69],[14,-87],[-71,-63],[-41,-12],[-38,58],[-28,-54]],[[5051,5788],[-69,-7],[-20,3]],[[4883,5975],[62,75],[21,58],[69,-24],[65,-28]],[[5100,6056],[48,52],[50,40],[50,0],[9,-52]],[[2511,4721],[38,41],[42,60],[-15,89],[54,37],[44,-23],[50,8]],[[3600,5461],[0,-1],[9,-12],[65,-34],[87,-15],[236,95],[84,67],[1,2]],[[5456,4707],[-28,-55],[-43,-83],[-28,-19],[-9,-101],[-37,-37],[-26,-60],[25,-13],[23,-13],[24,-30],[22,-26],[14,-53],[37,-145],[20,-31],[26,-8],[26,-27],[25,-24],[23,-23],[45,17]],[[4906,4507],[11,28],[6,46],[-1,30],[-19,74],[-14,90]],[[4453,5045],[-28,-60],[18,-67],[39,-96],[57,-15],[71,0],[43,110],[61,-38],[47,-9],[33,-9]],[[4441,4364],[-59,42],[-151,-30],[-38,-45]],[[4177,4416],[11,30],[1,101],[42,22],[69,-22],[2,74],[37,89],[12,82],[-27,59],[-17,45],[-4,125]],[[5329,7177],[31,-95],[23,-92],[11,-31],[3,-24],[31,-39],[-1,-20],[-4,-17],[-15,-28],[0,-12],[12,-28],[24,-55],[28,-46],[9,-44],[-3,-40],[-9,-49]],[[5469,6557],[-14,-42],[-31,-72]],[[5424,6443],[-23,-81],[-30,-41],[-54,-29],[-25,-69],[-12,-98],[-23,-29]],[[5100,6056],[14,98],[-2,86],[-23,41],[-52,-12],[-6,110],[61,29],[30,53]],[[5765,5491],[-14,-39],[7,-121]],[[5295,5260],[12,135],[3,96]],[[5310,5491],[38,-19],[61,110],[-13,110],[11,75],[-31,156],[18,46],[28,-69],[50,-29],[67,-4],[7,-81],[30,-46],[41,-48],[10,-36],[11,-18],[10,-2],[40,-35],[12,-25],[35,-35],[30,-50]],[[4273,5062],[-42,-77],[-32,-67],[-62,-7],[-114,-30],[-41,-67]],[[4812,5065],[-39,157],[-32,8]],[[4741,5230],[-47,74]],[[5051,5788],[54,-200],[79,-97],[67,37],[59,-37]],[[4726,7196],[-18,288],[-2,154],[-7,91],[-15,41],[-8,50],[6,109],[17,153],[-17,244],[-7,55],[-61,164],[-19,78],[0,75],[-15,196],[-4,98],[4,53],[10,50],[14,45],[60,-40],[39,3],[32,30],[16,42],[23,98],[17,32],[55,47],[72,107],[28,10],[39,-6]],[[4505,5246],[86,-38],[39,-23],[15,-81],[25,59],[71,67]],[[4818,6759],[21,-103],[16,-133],[-60,-11],[-100,-220]],[[4638,6364],[67,127],[29,116],[12,166],[-5,192],[-1,15]],[[5716,5991],[35,-85],[43,-91],[-50,-65],[24,-78],[26,-78],[-2,-65],[-27,-38]],[[5424,6443],[46,-43],[46,-97],[8,-30],[3,-29],[4,-50],[7,-57],[1,-18],[5,-66],[53,-23],[57,-20],[62,-19]],[[6338,6147],[-30,-104],[32,-39],[41,-13],[33,-124],[-2,-58],[-41,-65],[-54,-124],[-26,0],[-31,65],[-19,-39],[24,-78],[-9,-55]],[[6256,5513],[-22,-1]],[[5716,5991],[35,6],[49,26],[31,65],[23,52],[-32,72],[-15,78],[-9,104],[-17,84],[-28,26],[-48,0],[-19,59]],[[5686,6563],[56,78],[48,-13],[56,7],[34,84],[0,46]],[[7321,6909],[2,140],[12,5],[22,37],[-1,21],[-3,40],[5,28],[10,25],[4,31],[3,35],[8,23],[-3,22],[-5,17],[-9,13],[-11,12],[-10,15],[4,30],[12,23],[11,13],[18,37],[-21,9],[1,123]],[[7425,7944],[110,-77],[23,-36],[46,-107],[26,-47],[21,6],[19,27],[18,18],[14,-6],[25,-30],[13,-7],[14,11],[7,25],[5,31],[9,26],[40,59],[45,43],[47,25],[107,-10],[24,12]],[[6632,7610],[-80,-13],[-53,-71],[-6,-28],[-24,-34]],[[6469,7464],[-77,17],[-57,-73],[-19,-40],[-28,-14],[-11,13],[-13,24],[-13,13],[-35,-32],[-74,21],[-31,-26]],[[6111,7367],[-8,100],[-20,78],[-2,104]],[[6191,7766],[33,45],[36,78],[41,72],[46,32],[30,92]],[[6377,8085],[54,25],[45,-6],[44,-13],[17,-52],[24,-59],[-20,-52],[26,-26],[33,0],[41,-71],[-16,-20],[-51,-6],[13,-52],[49,-18],[41,31],[18,-52],[-63,-104]],[[5900,8858],[30,-20],[4,-71],[59,19],[90,20],[106,6]],[[6189,8812],[54,0],[81,13]],[[6511,8598],[-24,-72],[-69,-6],[-13,-46],[-15,-45],[0,-117],[-98,-41],[-28,-53],[33,-70],[52,-41],[28,-22]],[[6083,7818],[-36,71],[-54,78],[-48,33],[-13,91],[-52,97],[-8,39],[-37,26],[-13,78],[-45,-45],[-48,-39],[-39,0]],[[5585,8842],[23,74],[37,-6],[43,0],[28,-52],[22,-7],[6,39],[-13,78],[-15,46],[41,26],[22,-46],[91,-117],[30,-19]],[[6256,5513],[18,2],[67,-54],[23,-1],[28,10],[44,43],[6,0],[0,-7],[-2,-12],[3,-24],[-8,-39],[-6,-49],[94,95],[11,32],[30,20],[38,-22],[21,-41],[13,-10],[11,3],[12,14],[24,7],[13,-7],[10,-11],[5,-11],[5,-13],[6,-12],[5,-15],[7,-16],[5,-16],[45,7]],[[6834,5939],[-57,0],[-26,97],[-33,0],[-47,59],[-41,78],[-15,65],[10,123]],[[6625,6361],[37,39],[28,-6],[43,-46],[26,-45],[35,0],[71,26],[61,65],[33,59]],[[6111,7367],[8,-26],[-3,-6],[-15,-23],[10,-70],[-2,-27],[-6,-27],[0,-31],[-8,-19]],[[6095,7138],[-41,-4],[-12,16],[-19,35],[-8,25],[-9,9],[-30,-8],[-39,5],[-47,42],[-38,7],[-19,21],[-17,35],[-35,75],[-26,56],[0,55],[-24,83],[-35,-29],[-25,51]],[[5469,6557],[66,-33],[93,13],[58,26]],[[5323,9612],[29,42],[33,35],[106,25],[35,39],[83,136],[19,31],[30,31],[33,15]],[[5691,9966],[21,-94],[-7,-78],[-13,-91],[13,-91],[39,-20],[7,-84],[-18,-26],[13,-85],[46,-65],[39,-39],[23,-71],[7,-65],[41,-85],[4,-130],[-6,-84]],[[6189,8812],[-4,111],[-48,0],[-15,130],[-34,149],[-33,-6],[-30,91],[-50,6],[-41,33],[-13,104],[24,65],[33,71],[34,85],[20,-26],[6,-78],[35,13],[45,6],[4,85],[18,70]],[[6140,9721],[52,-100],[54,-56],[49,-17],[13,-15],[12,-31],[2,-23],[1,-5],[1,-27],[7,-33],[29,-61],[31,-31],[32,-7],[35,4],[22,12]],[[6095,7138],[-14,-68],[-28,-52],[-52,-6],[-45,19],[-56,-52],[-20,-71]],[[6469,7464],[-12,-101],[-32,-143],[-28,-39],[-5,-78],[-37,13],[-41,-13],[-47,-72],[2,-58],[28,-33],[20,-71],[10,-65],[33,-39],[26,-46],[4,-84]],[[6390,6635],[-2,-72],[-33,-46],[-21,-58]],[[6865,7736],[20,-61],[0,-81],[-34,-81],[-54,41],[-84,30],[-81,26]],[[5691,9966],[65,3],[35,-38],[19,-86],[13,-102],[17,-89],[20,-28],[22,0],[44,37],[27,58],[-9,66],[-39,113],[2,71],[17,28],[26,-7],[24,-33],[10,-28],[16,-75],[9,-25],[12,-12],[9,3],[9,8],[14,1],[55,-48],[32,-62]],[[6390,6635],[52,0],[43,39],[54,-33],[50,36]],[[6589,6677],[12,11],[22,4]],[[6623,6692],[-13,-97],[-10,-45],[-11,-130],[36,-59]],[[7021,6636],[-20,61],[-22,7],[-21,26],[-29,9],[-112,-14],[-9,8],[-17,-1],[-16,-8],[-152,-32]],[[6589,6677],[-11,40],[-6,49],[8,69],[-3,26],[5,29],[18,14],[-2,33],[-41,98],[-24,93],[13,72],[-65,214],[-12,50]],[[496,5425],[44,67],[31,80],[26,119],[17,148],[2,169],[-5,44],[-14,111],[2,45],[13,59],[4,36],[-4,270],[4,87],[9,74],[16,73],[22,57],[24,22],[19,34],[43,187]],[[901,7500],[107,341],[42,76],[58,52],[254,28],[60,31],[269,237]]],"transform":{"scale":[0.0007249401705170516,0.00024083884218421717],"translate":[20.968597852000073,55.666990866000106]}};
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = '__MNG__';
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = '__TKM__';
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = '__USA__';
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';

  /**************************************
                Utilities
  ***************************************/

  // Convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  // Add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data, options) {
    var svg = this.svg;
    var that = this;

    // When options.reset = true, reset all the fill colors to the defaultFill and kill all data-info
    if ( options && options.reset === true ) {
      svg.selectAll('.datamaps-subunit')
        .attr('data-info', function() {
           return "{}"
        })
        .transition().style('fill', this.options.fills.defaultFill)
    }

    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else if ( typeof subunitData.fillColor === "string" ) {
          color = subunitData.fillColor;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        // If it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          // If the subunit is of the form `XX.YY`, it will cause issues
          // with creating a valid CSS selector. So we'll need to replace
          // any "." inside the subunit with an escaped "\\.".
          .selectAll('.' + subunit.replace('.', '\\.'))
          .transition()
          .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(self.options.element);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return "";
          }
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        // Add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // Expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  }
  else if ( typeof define === "function" && define.amd ) {
    define( "datamaps", ["require", "d3", "topojson"], function(require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();

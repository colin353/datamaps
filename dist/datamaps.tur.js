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
  Datamap.prototype.lvaTopo = '__LVA__';
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
  Datamap.prototype.turTopo = {"type":"Topology","objects":{"tur":{"type":"GeometryCollection","geometries":[{"type":"Polygon","properties":{"name":null},"id":"-99","arcs":[[0]]},{"type":"MultiPolygon","properties":{"name":"Aydin"},"id":"TR.AY","arcs":[[[1]],[[2,3,4,5,6]]]},{"type":"MultiPolygon","properties":{"name":"Izmir"},"id":"TR.IZ","arcs":[[[7]],[[8]],[[-5,9,10,11]]]},{"type":"MultiPolygon","properties":{"name":"Balikesir"},"id":"TR.BK","arcs":[[[12]],[[13,14,15,-11,16,17,18]],[[19]]]},{"type":"MultiPolygon","properties":{"name":"Çanakkale"},"id":"TR.CK","arcs":[[[20]],[[21]],[[-18,22]],[[23,24,25]]]},{"type":"Polygon","properties":{"name":"Edirne"},"id":"TR.ED","arcs":[[26,27,-25,28]]},{"type":"Polygon","properties":{"name":"Kirklareli"},"id":"TR.KL","arcs":[[29,30,-27,31]]},{"type":"Polygon","properties":{"name":"Tekirdag"},"id":"TR.TG","arcs":[[32,-26,-28,-31,33]]},{"type":"Polygon","properties":{"name":"Bilecik"},"id":"TR.BC","arcs":[[34,35,36,37,38]]},{"type":"MultiPolygon","properties":{"name":"Bursa"},"id":"TR.BU","arcs":[[[39]],[[-38,40,-14,41,42,43,44]]]},{"type":"MultiPolygon","properties":{"name":"Istanbul"},"id":"TR.IB","arcs":[[[45]],[[46,47]],[[-34,-30,48]]]},{"type":"Polygon","properties":{"name":"Kocaeli"},"id":"TR.KC","arcs":[[49,-44,50,51,-47,52]]},{"type":"Polygon","properties":{"name":"Sakarya"},"id":"TR.SK","arcs":[[53,54,-39,-45,-50,55]]},{"type":"Polygon","properties":{"name":"Bolu"},"id":"TR.BL","arcs":[[56,57,58,59,-35,-55,60,61]]},{"type":"Polygon","properties":{"name":"Eskisehir"},"id":"TR.ES","arcs":[[62,63,64,65,-36,-60]]},{"type":"Polygon","properties":{"name":"Kastamonu"},"id":"TR.KS","arcs":[[66,67,68,69,70,71]]},{"type":"MultiPolygon","properties":{"name":"Antalya"},"id":"TR.AL","arcs":[[[72]],[[73]],[[74]],[[75]],[[76]],[[77]],[[78]],[[79,80,81,82,83,84,85]]]},{"type":"Polygon","properties":{"name":"Afyonkarahisar"},"id":"TR.AF","arcs":[[86,87,88,89,90,91,-65]]},{"type":"Polygon","properties":{"name":"Burdur"},"id":"TR.BD","arcs":[[-84,92,93,-89,94]]},{"type":"Polygon","properties":{"name":"Denizli"},"id":"TR.DN","arcs":[[-94,95,-7,96,97,-90]]},{"type":"Polygon","properties":{"name":"Isparta"},"id":"TR.IP","arcs":[[98,-85,-95,-88]]},{"type":"Polygon","properties":{"name":"Kütahya"},"id":"TR.KU","arcs":[[-37,-66,-92,99,100,-15,-41]]},{"type":"Polygon","properties":{"name":"Manisa"},"id":"TR.MN","arcs":[[-101,101,-97,-6,-12,-16]]},{"type":"MultiPolygon","properties":{"name":"Mugla"},"id":"TR.MG","arcs":[[[102]],[[103]],[[104]],[[-93,-83,105,-3,-96]]]},{"type":"Polygon","properties":{"name":"Adiyaman"},"id":"TR.AD","arcs":[[106,107,108,109,110]]},{"type":"Polygon","properties":{"name":"Elazig"},"id":"TR.EG","arcs":[[111,112,113,114,115]]},{"type":"Polygon","properties":{"name":"K. Maras"},"id":"TR.KM","arcs":[[116,-110,117,118,119,120,121]]},{"type":"Polygon","properties":{"name":"Malatya"},"id":"TR.ML","arcs":[[-113,122,-111,-117,123,124]]},{"type":"Polygon","properties":{"name":"Mersin"},"id":"TR.IC","arcs":[[125,126,-81,127,128,129]]},{"type":"Polygon","properties":{"name":"Kirsehir"},"id":"TR.KH","arcs":[[130,131,132,133,134]]},{"type":"Polygon","properties":{"name":"Kayseri"},"id":"TR.KY","arcs":[[-121,135,136,137,138,139]]},{"type":"Polygon","properties":{"name":"Nevsehir"},"id":"TR.NV","arcs":[[140,-138,141,142,-131]]},{"type":"Polygon","properties":{"name":"Hatay"},"id":"TR.HT","arcs":[[143,144,145,146]]},{"type":"Polygon","properties":{"name":"Amasya"},"id":"TR.AM","arcs":[[147,148,149,150]]},{"type":"Polygon","properties":{"name":"Çorum"},"id":"TR.CM","arcs":[[151,-150,152,153,154,-68,155]]},{"type":"Polygon","properties":{"name":"Giresun"},"id":"TR.GI","arcs":[[156,157,158,159,160,161]]},{"type":"Polygon","properties":{"name":"Ordu"},"id":"TR.OR","arcs":[[-160,162,163,164,165]]},{"type":"Polygon","properties":{"name":"Sinop"},"id":"TR.SP","arcs":[[166,-156,-67,167]]},{"type":"Polygon","properties":{"name":"Sivas"},"id":"TR.SV","arcs":[[168,-124,-122,-140,169,170,-163,-159]]},{"type":"Polygon","properties":{"name":"Samsun"},"id":"TR.SS","arcs":[[-165,171,-151,-152,-167,172]]},{"type":"Polygon","properties":{"name":"Tokat"},"id":"TR.TT","arcs":[[-164,-171,173,-148,-172]]},{"type":"Polygon","properties":{"name":"Artvin"},"id":"TR.AV","arcs":[[174,175,176,177]]},{"type":"Polygon","properties":{"name":"Erzurum"},"id":"TR.EM","arcs":[[178,179,180,181,182,183,184,-176,185]]},{"type":"Polygon","properties":{"name":"Erzincan"},"id":"TR.EN","arcs":[[-183,186,187,-114,-125,-169,-158,188,189]]},{"type":"Polygon","properties":{"name":"Rize"},"id":"TR.RI","arcs":[[-185,190,191,-177]]},{"type":"Polygon","properties":{"name":"Trabzon"},"id":"TR.TB","arcs":[[-191,192,193,-162,194]]},{"type":"Polygon","properties":{"name":"Agri"},"id":"TR.AG","arcs":[[195,196,197,198,199,-180,200]]},{"type":"Polygon","properties":{"name":"Bingöl"},"id":"TR.BG","arcs":[[201,202,-116,203,-187,-182]]},{"type":"Polygon","properties":{"name":"Diyarbakir"},"id":"TR.DY","arcs":[[204,205,206,-107,-123,-112,-203,207]]},{"type":"Polygon","properties":{"name":"Mus"},"id":"TR.MS","arcs":[[208,209,-208,-202,-181,-200]]},{"type":"Polygon","properties":{"name":"Bitlis"},"id":"TR.BT","arcs":[[210,211,-209,-199,212]]},{"type":"Polygon","properties":{"name":"Ankara"},"id":"TR.AN","arcs":[[213,-133,214,215,-63,-59,216]]},{"type":"Polygon","properties":{"name":"Çankiri"},"id":"TR.CI","arcs":[[-155,217,-217,-58,218,-69]]},{"type":"Polygon","properties":{"name":"Zinguldak"},"id":"TR.ZO","arcs":[[219,-62,220,221,222]]},{"type":"Polygon","properties":{"name":"Konya"},"id":"TR.KO","arcs":[[223,224,-129,225,-86,-99,-87,-64,-216]]},{"type":"Polygon","properties":{"name":"Karaman"},"id":"TR.KR","arcs":[[-128,-80,-226]]},{"type":"Polygon","properties":{"name":"Usak"},"id":"TR.US","arcs":[[-91,-98,-102,-100]]},{"type":"Polygon","properties":{"name":"Gaziantep"},"id":"TR.GA","arcs":[[226,227,228,-145,229,-118,-109]]},{"type":"Polygon","properties":{"name":"Sanliurfa"},"id":"TR.SU","arcs":[[230,231,-227,-108,-207]]},{"type":"Polygon","properties":{"name":"Adana"},"id":"TR.AA","arcs":[[-120,232,-147,233,-126,234,-136]]},{"type":"Polygon","properties":{"name":"Kinkkale"},"id":"TR.KK","arcs":[[-154,235,-134,-214,-218]]},{"type":"Polygon","properties":{"name":"Nigde"},"id":"TR.NG","arcs":[[-137,-235,-130,-225,236,-142]]},{"type":"Polygon","properties":{"name":"Aksaray"},"id":"TR.AK","arcs":[[-143,-237,-224,-215,-132]]},{"type":"Polygon","properties":{"name":"Yozgat"},"id":"TR.YZ","arcs":[[-174,-170,-139,-141,-135,-236,-153,-149]]},{"type":"Polygon","properties":{"name":"Gümüshane"},"id":"TR.GU","arcs":[[237,-189,-157,-194]]},{"type":"Polygon","properties":{"name":"Bayburt"},"id":"TR.BB","arcs":[[-184,-190,-238,-193]]},{"type":"Polygon","properties":{"name":"Kars"},"id":"TR.KA","arcs":[[238,-201,-179,239,240]]},{"type":"Polygon","properties":{"name":"Mardin"},"id":"TR.MR","arcs":[[241,242,-231,-206,243]]},{"type":"Polygon","properties":{"name":"Batman"},"id":"TR.BM","arcs":[[244,-244,-205,-210,-212]]},{"type":"Polygon","properties":{"name":"Siirt"},"id":"TR.SI","arcs":[[245,246,-245,-211]]},{"type":"Polygon","properties":{"name":"Sirnak"},"id":"TR.SR","arcs":[[247,248,-242,-247,249]]},{"type":"Polygon","properties":{"name":"Tunceli"},"id":"TR.TC","arcs":[[-204,-115,-188]]},{"type":"Polygon","properties":{"name":"Hakkari"},"id":"TR.HK","arcs":[[250,-248,251]]},{"type":"Polygon","properties":{"name":"Van"},"id":"TR.VA","arcs":[[252,-252,-250,-246,-213,-198]]},{"type":"Polygon","properties":{"name":"Ardahan"},"id":"TR.AR","arcs":[[-240,-186,-175,253]]},{"type":"Polygon","properties":{"name":"Iğdir"},"id":"TR.IG","arcs":[[-196,-239,254]]},{"type":"Polygon","properties":{"name":"Kilis"},"id":"TR.KI","arcs":[[255,-229]]},{"type":"Polygon","properties":{"name":"Osmaniye"},"id":"TR.OS","arcs":[[-119,-230,-144,-233]]},{"type":"Polygon","properties":{"name":"Yalova"},"id":"TR.YL","arcs":[[-51,-43,256]]},{"type":"Polygon","properties":{"name":"Düzce"},"id":"TR.DU","arcs":[[-61,-54,257,-221]]},{"type":"Polygon","properties":{"name":"Karabük"},"id":"TR.KB","arcs":[[-219,-57,-220,258,-70]]},{"type":"Polygon","properties":{"name":"Bartın"},"id":"TR.BR","arcs":[[-259,-223,259,-71]]}]}},"arcs":[[[4243,576],[-5,-12],[2,8],[3,4]],[[789,2792],[6,-23],[-5,7],[-2,9],[-2,2],[2,-5],[-1,-3],[-8,36],[-3,15],[5,3],[3,-7],[-3,-9],[3,-7],[5,-18]],[[1539,2640],[-69,22],[-38,50],[-33,68],[-37,19],[-29,-48],[-18,-87],[-21,-41],[-63,-11],[-37,4],[-22,28],[-24,-1],[-24,-14],[-23,9],[-37,61],[-42,15],[-20,18],[-19,30],[-17,-2],[-16,-22],[-7,-27],[-28,-149],[-6,-26]],[[909,2536],[-9,0],[-8,-11],[-5,-21],[-3,-21],[-5,-13],[-13,0],[0,-12],[8,-12],[-3,-7],[-31,-4],[-7,-7],[-6,-13],[-4,12],[-4,7],[-3,0],[-4,-7],[0,11],[-1,5],[-2,5],[-4,-7],[-2,-1],[-1,3],[-4,5],[5,15],[4,16],[1,17],[-3,18],[8,9],[3,2],[0,10],[-4,31],[2,73],[-9,-7],[-3,10],[-3,0],[-4,-8],[-4,-12],[2,27],[3,24],[2,23],[-3,24],[2,11],[-3,6],[-2,10],[3,18],[8,-14],[5,25],[1,36],[-2,18],[-8,7],[-30,47],[-45,31],[-20,25],[5,32],[9,6],[35,-6],[12,4],[45,40],[6,11],[13,38],[3,24],[2,36],[1,34],[-1,20],[-4,15],[-5,13],[-3,19],[1,30],[2,6],[7,14],[2,12],[1,6]],[[835,3294],[1,0],[34,2],[42,39],[64,101],[27,11],[128,-24],[121,78],[101,3],[19,18],[18,24],[21,15],[21,8],[82,72]],[[1514,3641],[71,-4]],[[1585,3637],[6,-36],[7,-35],[29,-48],[6,-47],[-1,-54],[9,-96],[-5,-34],[-12,-20],[-1,-42],[11,-37],[8,-40],[12,-42],[33,-16],[5,-36],[-2,-44],[-16,-28],[-20,-2],[-24,-84],[-28,-64],[-40,13],[-37,-26],[-11,-59],[7,-61],[5,-5],[6,-9],[4,-22],[3,-23]],[[362,4168],[-1,-17],[-3,-3],[-2,4],[-4,-4],[-2,-2],[-2,-2],[-1,19],[-1,12],[6,6],[4,7],[6,6],[2,-14],[-2,-12]],[[564,4210],[-6,-8],[-4,8],[-1,9],[-12,13],[-3,9],[0,47],[2,13],[2,20],[0,14],[1,1],[4,-3],[6,-13],[4,-19],[1,-41],[7,-18],[1,-12],[-2,-20]],[[835,3294],[1,8],[1,13],[-1,13],[-2,15],[8,16],[-5,35],[-14,59],[-13,-11],[-19,0],[-19,8],[-13,12],[-3,9],[-2,12],[-3,9],[-5,4],[-4,1],[-4,2],[-3,5],[-1,8],[-2,25],[-5,8],[-15,6],[-27,25],[-13,3],[-17,-8],[-9,-9],[-3,-1],[-3,-5],[-2,-11],[-2,-12],[-4,-5],[-4,8],[-12,57],[3,20],[-1,24],[-3,23],[-3,21],[-5,22],[-12,28],[-5,15],[-9,-11],[-2,20],[1,47],[-7,15],[-8,-2],[-9,-8],[-10,-5],[-33,-1],[-5,-5],[-7,-103],[-2,4],[0,2],[-2,4],[-3,0],[2,-23],[0,-20],[-3,-16],[-6,-7],[-4,7],[-6,39],[-5,20],[0,-34],[-5,-2],[-7,13],[-11,27],[-3,13],[-1,16],[2,22],[-14,-9],[-13,26],[-13,34],[-13,14],[2,-25],[1,-7],[-3,0],[-3,10],[-11,27],[1,17],[1,14],[0,14],[-2,16],[-4,0],[-4,-43],[-11,-11],[-13,11],[-17,34],[-5,8],[-28,20],[0,10],[3,25],[14,-15],[5,22],[5,29],[12,7],[0,12],[-10,16],[-2,30],[5,17],[7,-19],[0,15],[2,6],[2,4],[3,6],[2,-19],[0,-17],[-2,-15],[-4,-14],[3,-5],[2,-3],[4,-1],[4,-1],[4,-2],[1,-7],[1,-7],[3,-5],[7,-2],[8,4],[4,10],[-5,19],[0,11],[8,-13],[4,0],[6,2],[6,7],[13,22],[4,5],[7,14],[1,32],[-5,33],[-8,18],[0,11],[13,-15],[6,-16],[5,1],[8,41],[-8,11],[-12,28],[-11,10],[-7,15],[-5,2],[-5,-7],[-4,-21],[-3,-5],[-11,1],[1,7],[4,16],[4,30],[-2,19],[-16,57],[3,-10],[-1,19],[-7,48],[-1,10],[1,10],[-6,60],[0,23],[1,23],[3,19],[5,7],[8,3],[11,14],[6,4],[14,-3],[13,-8],[12,-13],[9,-19],[18,-46],[8,-29],[3,-25],[12,-46],[13,-41],[5,-10],[3,-7],[3,-8],[3,-18],[1,-18],[0,-15],[0,-15],[3,-16],[-4,-7],[-1,-3],[-2,-1],[-5,9],[-5,3],[-6,-3],[-6,-9],[9,-11],[0,-15],[-5,-18],[-4,-23],[12,-4],[6,-18],[3,-24],[6,-25],[9,-72],[8,-35],[12,10],[2,20],[-3,13],[-8,15],[-4,66],[3,28],[6,27],[8,17],[8,-7],[0,11],[4,0],[6,-16],[6,-29],[9,-64],[3,3],[6,5],[2,4],[4,-21],[8,2],[9,12],[9,7],[42,9],[26,30],[8,4],[2,3],[7,14],[3,5],[6,-1],[4,-5],[5,-2],[7,8],[0,-7],[3,7],[14,-17],[13,19],[12,31],[15,21],[0,11],[-5,9],[-2,-1],[-4,-8],[-4,12],[-10,-11],[-17,4],[-5,-5],[-13,16],[-14,-2],[-33,-32],[-11,-13],[-2,1],[6,19],[-9,15],[-16,62],[-7,10],[-13,10],[-6,8],[-11,22],[-7,26],[8,-18],[9,-17],[14,-21],[9,1],[0,11],[-7,18],[-6,15],[-7,11],[-9,10],[2,19],[3,39],[2,19],[-7,17],[-5,-5],[-6,-11],[-11,-1],[3,17],[1,6],[-11,10],[-7,2],[-7,-2],[1,7],[2,18],[1,8],[-7,0],[-5,6],[-10,16],[4,10],[4,8],[5,4],[5,0],[-10,37],[-4,21],[-4,29],[10,16],[27,13],[15,26],[3,-3],[2,-5],[1,-4],[1,-1],[6,-2],[5,-1],[12,-13],[7,-5],[8,1],[-3,21],[5,9],[4,10],[4,4],[4,-12],[2,13],[0,12],[0,13],[-2,17],[-3,-12],[-11,44],[-3,11],[21,22],[3,-34],[9,-4],[5,20],[-6,41],[8,6],[8,11],[7,12],[5,13],[11,-17],[11,17],[4,25],[-11,8],[8,43],[0,17],[-8,17],[-9,-19],[-6,-10],[-6,-3],[-10,-1],[-3,5],[-5,23],[-2,5],[-7,-5],[-4,-8],[-4,-2],[-5,15],[-6,-13],[-18,-25],[-7,-5],[-5,7],[-8,29],[-8,7],[-10,16],[-5,37],[1,40],[8,26],[0,11],[-2,0],[-9,0],[7,19],[12,22],[13,17],[10,8],[5,13],[-4,31],[-12,48],[-15,45],[-7,13],[-16,20]],[[583,5335],[112,192],[10,26],[9,37],[10,34],[15,21],[16,15],[95,144],[30,-14],[22,-49],[16,-71]],[[918,5670],[20,-122],[17,-191],[9,-57],[19,-86],[-4,-84],[-14,-39],[-34,-67],[-33,-32],[-29,-47],[-6,-58],[-3,-62],[-10,-53],[-16,-39],[-14,-58],[-2,-33],[14,-35],[8,-8],[12,-37],[14,-110],[31,-63],[37,-9],[58,4],[11,-5],[16,-36],[8,-88],[37,-62],[40,-45],[5,-23],[6,-50],[4,-24],[22,-49],[27,15],[12,52],[9,51],[24,-3],[25,-27],[17,-1],[15,11],[21,-56],[15,-80],[51,20],[20,15],[13,-6],[11,-29],[18,-13],[12,-2],[23,-15],[15,-45],[22,-163],[23,-85]],[[1030,7400],[5,-11],[4,1],[2,-5],[0,-12],[-6,-3],[-7,9],[-9,5],[-9,2],[-8,12],[-1,18],[6,11],[4,20],[4,15],[18,-18],[1,-11],[-3,-14],[-1,-19]],[[1329,7293],[-2,-11],[-25,-90],[-16,-29],[-14,-33],[4,-54],[12,-8],[10,-52],[-5,-29],[-7,-26],[-7,-60],[3,-31],[9,-60],[20,-72],[28,-47],[10,-40],[9,-110],[9,-50],[139,-240],[41,-12],[11,27],[14,15],[8,-27],[-2,-32],[1,-44],[10,-39],[3,-19],[6,-10],[10,-1],[7,-12],[13,-47],[21,-7],[24,11],[24,-2],[16,-18],[13,-32]],[[1726,6002],[-11,-46],[-3,-31],[0,-31],[-4,-20],[-6,-14],[-7,-46],[-6,-113],[-13,-47],[-12,-36],[-4,-22],[-16,-69],[-17,-29],[-38,-31],[-20,-24],[-5,-54],[3,-18],[1,-40],[-3,-17]],[[1565,5314],[-46,17],[-48,-59],[-19,-12],[-20,-6],[-23,5],[-21,-9],[-14,-45],[-20,-27],[-22,-12],[-22,-22],[-24,21],[-27,143],[-43,110],[-4,23],[-8,11],[-39,-34],[-21,23],[6,56],[16,66],[-13,50],[-8,0],[-17,-8],[-8,3],[-21,24],[-21,4],[-37,-12],[-37,25],[-22,44],[-24,26],[-40,-49]],[[583,5335],[-4,5],[-11,18],[-7,20],[1,17],[-4,32],[-3,31],[-4,25],[-9,10],[-25,-4],[-13,3],[-10,11],[5,12],[3,32],[4,16],[7,7],[5,-7],[-1,-11],[-9,-5],[0,-10],[6,1],[5,-5],[4,-8],[3,-11],[-3,25],[3,13],[6,7],[5,9],[9,33],[55,99],[-4,9],[-3,2],[0,10],[1,11],[0,9],[-1,14],[19,3],[7,7],[7,11],[-6,24],[8,15],[31,23],[2,3],[-1,6],[1,16],[8,61],[-1,34],[-3,22],[-8,11],[-15,4],[-12,-12],[-10,-21],[-10,-11],[-13,22],[-74,-31]],[[524,5942],[-1,128],[17,125],[21,10],[47,-13],[22,17],[20,39],[38,36],[22,43],[24,0],[16,-5],[15,18],[38,-15],[38,-30],[23,21],[21,34],[22,23],[20,36],[12,60],[9,65],[2,65],[-8,17],[-9,34],[5,27],[4,12],[5,37],[3,42],[7,51],[3,31],[-2,10],[-10,4],[-20,20],[-10,48],[6,12],[8,7],[36,89],[25,35],[6,70],[-2,14]],[[997,7159],[13,21],[8,4],[15,-8],[13,-14],[12,-6],[12,17],[11,-11],[16,-3],[14,8],[12,43],[28,34],[9,28],[-10,1],[-26,21],[-8,-11],[-4,-1],[-2,17],[-1,15],[-3,5],[-4,1],[-3,6],[-3,13],[-3,7],[-1,9],[0,20],[-2,10],[-4,3],[-5,0],[-4,4],[-17,39],[-4,16],[0,10],[6,6],[5,9],[9,23],[5,7],[5,-7],[4,-3],[5,20],[10,-30],[1,-5],[5,-1],[1,4],[2,6],[5,3],[86,-31],[23,-19],[10,-27],[-9,-37],[-45,-54],[-14,-27],[3,-41],[19,-13],[43,9],[44,39],[50,5]],[[1028,7713],[14,-16],[8,5],[15,-5],[13,-17],[3,-28],[-10,-16],[-19,-8],[-10,-7],[-18,-36],[-10,-10],[-12,12],[-5,1],[-11,10],[-8,17],[2,34],[-4,12],[-3,14],[3,17],[4,11],[3,5],[3,-4],[2,-17],[13,15],[13,11],[14,0]],[[197,6410],[3,-2],[3,0],[2,-2],[3,-8],[8,11],[3,-15],[0,-56],[-4,-24],[-8,2],[-17,28],[-16,17],[-7,12],[-3,20],[5,13],[9,4],[19,0]],[[157,6907],[5,-6],[9,7],[8,14],[3,0],[0,-33],[-11,-14],[-12,-10],[-35,-13],[-23,-23],[-47,-17],[-11,1],[-13,11],[-6,8],[-3,8],[-21,18],[0,10],[12,45],[17,42],[21,31],[35,16],[46,39],[6,2],[7,-1],[3,-8],[3,-12],[4,-10],[7,-3],[0,-11],[-1,-13],[-1,-20],[0,-21],[2,-12],[-4,-25]],[[524,5942],[-110,-48],[-11,-11],[-6,-14],[-5,0],[-23,-31],[-4,-7],[-6,0],[-28,12],[-5,-2],[-7,-8],[-6,-2],[-4,-14],[-1,-3],[-2,-8],[-3,3],[-6,11],[-41,-24],[-21,0],[-20,24],[-3,35],[13,83],[9,78],[19,45],[5,37],[3,88],[-2,17],[-10,44],[-2,21],[1,14],[2,5],[3,4],[1,9],[0,38],[3,42],[-2,14],[-8,4],[3,18],[8,80],[-1,10],[-2,31],[-1,14],[2,14],[4,22],[1,13],[2,15],[11,45],[5,11],[28,-22],[8,13],[18,18],[5,8],[22,52],[5,18],[2,13],[0,21],[2,9],[0,7],[0,7],[0,6],[2,2],[5,0],[3,1],[2,5],[4,20],[2,29],[-1,30],[-3,24],[3,23],[3,10],[4,2],[6,0],[7,3],[14,15],[17,11],[10,19],[23,72],[5,7],[5,4],[7,9],[6,12],[56,160],[11,20],[22,4],[45,-9],[18,10],[5,-4],[14,-18],[30,-6],[11,6],[15,27],[13,38],[16,30],[24,3],[18,-9],[20,-1],[11,6],[18,26],[8,0],[9,-15],[5,-23],[8,-49],[-7,-11],[-4,0],[-2,6],[0,1],[-1,-3],[-4,-4],[23,-58],[28,-44],[31,-32],[38,-21],[14,0],[6,2],[5,8]],[[679,7550],[-7,-2],[-20,-14],[-30,-44],[-8,-17],[-9,-15],[-32,-11],[-10,-14],[-17,-35],[-7,-6],[-6,-10],[-5,-47],[-5,-20],[-17,-21],[-4,-12],[-1,-27],[-3,-26],[-8,-21],[-29,-61],[-3,-7],[-16,-8],[-6,-13],[-11,-27],[-1,-6],[-2,-6],[-14,-38],[-9,-18],[-12,-18],[-13,-13],[-11,-5],[-7,-13],[2,-29],[7,-30],[7,-15],[-25,-55],[-8,-14],[-20,-28],[-16,-34],[-7,-10],[-27,-22],[-6,-2],[-5,9],[1,19],[5,19],[3,9],[8,15],[6,33],[4,34],[3,15],[24,78],[6,57],[-3,43],[-10,34],[-15,29],[5,10],[2,11],[-2,8],[-7,3],[-2,7],[4,16],[7,13],[4,3],[6,12],[26,25],[11,0],[7,32],[26,39],[25,48],[31,27],[23,46],[15,22],[16,18],[14,7],[25,-7],[7,7],[7,18],[11,40],[8,20],[12,-15],[17,13],[14,29],[7,33],[-16,79],[-4,15],[-5,-2]],[[584,7707],[0,8],[3,93],[0,5]],[[587,7813],[76,-18],[0,-126],[16,-119]],[[614,9802],[0,-1],[13,-184],[16,-152],[6,-154],[-11,-153],[-22,-74],[-7,-114],[-26,-123],[16,-72]],[[599,8775],[6,-28],[4,-223],[-8,-94],[-26,-77],[-16,-95],[-9,-112],[4,-130],[19,-100],[14,-103]],[[584,7707],[-35,-13],[-12,-14],[-7,-5],[-36,0],[-14,-10],[-40,-55],[-15,23],[-8,7],[-9,3],[-7,-7],[-8,-11],[-8,-6],[-14,16],[-9,-2],[-28,-19],[-97,1],[-13,6],[-8,10],[-4,24],[-4,30],[-4,24],[4,24],[-2,35],[-5,35],[-8,24],[4,3],[2,3],[20,-5],[16,18],[11,32],[5,43],[8,29],[28,56],[-4,18],[0,10],[2,6],[5,5],[-2,2],[-1,0],[-1,3],[1,7],[4,3],[3,4],[0,8],[0,17],[3,-15],[0,-7],[4,0],[4,9],[3,15],[4,32],[3,0],[2,-9],[3,-8],[3,-4],[5,-2],[7,4],[-1,11],[-3,11],[-1,6],[6,15],[15,17],[7,13],[5,16],[-1,6],[-5,5],[-6,16],[-1,14],[1,11],[5,6],[8,2],[4,9],[4,18],[-1,19],[-14,15],[-4,17],[-7,36],[-2,23],[9,42],[-4,7],[-7,5],[0,13],[9,35],[-6,28],[-1,28],[2,31],[5,35],[-8,27],[6,13],[33,8],[9,10],[14,29],[14,21],[3,8],[2,7],[2,5],[5,2],[27,65],[5,-16],[10,-13],[12,-6],[9,2],[7,15],[5,28],[2,33],[0,34],[-2,32],[-8,77],[-3,60],[-3,27],[-5,23],[3,16],[-2,41],[2,19],[-1,9],[-2,11],[0,12],[0,12],[-10,-35],[-5,13],[-24,28],[-30,51],[5,20],[2,23],[-9,5],[-9,9],[-20,12],[-14,30],[-9,7],[-14,-3],[-5,17],[-4,32],[2,34],[7,39],[22,43],[54,-6],[25,18],[7,22],[4,29],[2,29],[1,11],[0,10],[1,8],[2,14],[0,9],[-1,6],[-7,9],[-1,6],[3,10],[3,8],[4,6],[15,37],[8,14],[10,2],[49,-18],[10,2],[5,9],[11,26],[7,4],[4,-5],[10,-19],[6,-4],[4,5],[6,10]],[[1327,9109],[-24,-76],[-1,0]],[[1302,9033],[-92,-22],[-90,-27],[-57,-31],[-51,-35],[-24,-85],[-19,-88],[-31,-53],[-33,-21],[-29,44],[-23,71],[-30,44],[-60,0],[-86,-15],[-78,-40]],[[614,9802],[6,12],[5,8],[6,1],[5,-4],[5,-1],[6,13],[5,6],[10,-4],[4,3],[6,16],[4,19],[5,16],[7,7],[10,16],[12,49],[13,15],[9,-1],[10,-6],[9,-12],[8,-15],[6,1],[11,-1],[13,-7],[2,2],[1,5],[1,7],[12,35],[6,12],[12,4],[18,-10],[17,-23],[14,-32],[22,-77],[11,-31],[13,-25],[38,-49],[8,-16],[13,-40],[7,-11],[8,9],[-7,7],[1,3],[3,4],[2,4],[-1,2],[-2,2],[-1,2],[-1,4],[11,9],[5,8],[5,13],[4,-7],[2,0],[2,8],[1,16],[41,24],[19,-2],[28,-34],[7,-6],[7,1],[6,6],[2,10],[-9,11],[2,16],[0,21],[1,16],[2,2],[2,1],[2,-1],[3,-2],[10,4],[4,-1],[13,-7],[14,-15],[7,-5],[26,6],[8,-5],[18,-10],[8,-76],[0,-18],[2,-4],[4,-10],[2,-12],[-1,-11],[-5,-7],[-5,2],[-10,10],[-8,-1],[-7,-9],[-5,-21],[-1,-40],[3,-42],[8,-29],[9,-25],[9,-29],[10,-72],[6,-21],[9,-20],[4,-12],[3,-16],[1,-3],[2,-5],[0,-10],[-1,-5],[-3,0],[-2,-1],[-1,-10],[4,-25],[7,-29],[9,-24],[15,-20],[7,-23],[11,-42],[14,-29]],[[1312,8378],[-5,7],[-25,-22],[-4,-6],[-5,0],[-29,-27],[-8,-5],[-9,-11],[-8,-14],[-5,-13],[-12,-44],[-4,-20],[1,-13],[-9,-7],[-42,12],[-8,12],[-7,14],[-9,12],[-20,14],[-20,2],[-112,-37],[-16,-22],[-11,-53],[-14,-128],[-11,-48],[-49,-112],[-22,-92],[-47,-80],[-3,-8],[-6,-19],[-2,-6],[-6,-4],[-12,-4],[-15,-22],[-24,1],[-11,-3],[-9,-17],[-15,-50],[-6,-10],[-14,-5]],[[1302,9033],[14,-113],[5,-105],[-15,-131],[-7,-95],[7,-122],[6,-89]],[[2592,7185],[7,-71],[32,-132],[20,-58]],[[2651,6924],[-54,-5],[-42,-80],[-9,-81],[-7,-83],[-18,-74],[-26,-46],[-29,1],[-26,-27],[-8,-34],[-9,-31],[-16,-19],[-14,-28],[-5,-162],[-23,-94],[-29,-79]],[[2336,6082],[-19,-12],[-39,-12],[-41,-26],[-23,14],[-58,97],[-18,18],[-21,33],[-9,24],[-17,87],[-3,67],[9,136]],[[2097,6508],[29,-15],[26,23],[-7,80],[-14,25],[-27,92],[-1,80],[15,159],[50,125],[9,43],[-2,44],[-12,34],[-2,51],[6,38],[6,42],[2,52],[10,43],[10,26],[12,20],[27,36]],[[2234,7506],[15,-71],[19,-65],[20,-41],[19,-49],[46,-32],[73,44],[22,5],[19,-12],[21,-1],[16,-24],[13,-45],[9,-17],[39,2],[27,-15]],[[1498,7476],[-6,-7],[-2,12],[4,44],[-2,26],[9,6],[3,-1],[2,-6],[1,-8],[-3,-6],[-6,-60]],[[2097,6508],[-16,-5],[-15,-17],[-17,-6],[-17,5],[-54,50],[-27,-44],[-10,-95],[-6,-36],[-11,-27],[-14,-127],[-24,-41],[-11,-72],[-4,-106],[-29,-43],[-37,-1],[-37,10],[-23,13],[-19,36]],[[1329,7293],[73,7],[28,-10],[45,4],[-6,-4],[-4,-5],[-3,-10],[-2,-14],[21,19],[24,0],[25,-15],[24,-27],[3,10],[2,-2],[2,-6],[3,-2],[5,5],[5,13],[5,5],[29,11],[8,16],[8,10],[10,-3],[18,-13],[15,-2],[15,-8],[8,-8],[12,-18],[9,-8],[9,-3],[41,2],[9,5],[7,13],[4,21],[5,43],[4,18],[7,-7],[8,1],[9,7],[8,10],[-9,27],[-12,24],[-12,18],[-12,7],[-28,0],[-5,-5],[-11,-22]],[[1733,7397],[-2,173],[37,-21],[16,5],[79,-83],[33,17],[34,81],[33,-15]],[[1963,7554],[29,-22],[30,4],[97,83],[36,17],[72,-60]],[[2227,7576],[2,-36],[5,-34]],[[1806,8007],[-2,-24],[-7,11],[1,12],[0,11],[1,5],[2,6],[0,7],[2,4],[8,4],[-1,-21],[-2,-2],[-1,-4],[-1,-9]],[[2193,8490],[1,-15],[5,-48],[2,-51],[-15,-80],[-28,-36],[-34,-30],[-30,-49],[-4,-39],[-9,-36],[-19,-5],[-15,29],[-16,78],[-25,49],[-28,6],[-23,-39],[-21,-50],[-14,-15],[-27,-54],[-18,-54]],[[1875,8051],[-6,11],[-11,-4],[-10,22],[-30,33],[-10,20],[-11,31],[-11,21],[-29,36],[3,3],[0,1],[0,1],[1,7],[-6,6],[-3,16],[-2,22],[-3,21],[9,12],[11,28],[8,33],[8,60],[6,23],[1,20],[-11,19],[12,43],[20,51],[20,33],[16,-6],[4,0],[5,16],[8,3],[98,-42],[104,-57],[127,-44]],[[1327,9109],[15,-33],[79,-114],[113,-112],[161,-176],[52,-27],[3,-3],[1,-3],[1,-4],[3,-1],[5,3],[3,15],[3,4],[13,-5],[13,-11],[8,-18],[-5,-40],[-7,-29],[-9,-28],[-9,-12],[-6,-4],[1,-11],[5,-12],[3,-13],[3,-12],[1,-2],[3,-4],[-1,-10],[-3,-7],[-1,-1],[-2,-31],[-3,-29],[-5,-24],[-6,-20],[-4,-8],[-9,-7],[-5,-7],[-4,-14],[0,-9],[0,-6],[0,-8],[2,-5],[0,-9],[-3,-9],[-3,-1],[-11,2],[-4,9],[-3,1],[-3,-4],[-5,-14],[-2,-3],[-5,-4],[-10,-15],[-21,-10],[-5,-4],[-3,-5],[-2,-7],[-3,-6],[-6,-4],[-13,2],[-6,5],[-3,9],[-5,12],[-13,2],[-63,-19],[-16,15],[5,50],[-6,15],[-4,5],[-5,3],[4,36],[-5,32],[-11,22],[-13,8],[3,-23],[11,-27],[4,-27],[0,-16],[-1,-23],[-3,-22],[-7,-14],[-15,5],[-27,64],[-13,16],[-17,7],[-37,30],[-18,7],[-18,0],[-4,4],[-6,15],[-4,4],[-19,-11],[-10,-1],[-3,5]],[[2489,8521],[-2,-24],[-17,-98],[9,-81],[38,-16],[3,-52],[-12,-50],[-3,-53],[-9,-4],[-30,-2],[-17,18],[-20,11],[-10,-14],[4,-35],[8,-5],[6,-10],[-34,-84],[-21,-237],[-21,-99],[-31,-47],[-34,-18],[-16,-23],[-17,-15],[-36,-7]],[[1963,7554],[4,61],[0,142]],[[1967,7757],[4,7],[7,7],[6,7],[2,12],[2,12],[5,8],[6,5],[6,3],[5,-3],[8,-9],[8,-19],[3,-30],[6,0],[101,54],[60,7],[19,-21],[11,1],[7,29],[-5,37],[-20,9],[-42,-13],[-4,-3],[-4,-4],[-4,-4],[-6,0],[-6,7],[-11,22],[-3,5],[-8,3],[-19,15],[-10,4],[-124,-12],[-10,-8],[-8,-15],[-9,-8],[-11,9],[-4,13],[-2,15],[-3,12],[-5,4],[2,4],[1,3],[2,3],[2,2],[-2,16],[-3,11],[-4,9],[-5,7],[-3,-10],[-5,10],[-4,-10],[-6,-5],[-14,-7],[0,10],[5,1],[3,7],[2,11],[0,16],[5,-8],[2,-4],[0,6],[0,4],[2,1],[2,1],[-6,20],[-10,29],[-6,9]],[[2193,8490],[12,-3],[132,-9],[14,5],[8,8],[12,20],[8,4],[4,10],[4,18],[4,13],[4,-8],[5,13],[7,25],[6,6],[7,-12],[21,-11],[17,-31],[31,-17]],[[2764,8380],[0,-15],[3,-46],[0,-35],[-30,-64],[-18,-95],[4,-48],[9,-42],[1,-48],[-7,-45],[6,-43],[10,-36],[-11,-49]],[[2731,7814],[-33,-60],[1,-51],[3,-50],[-6,-47],[-34,-38],[-36,3],[-21,-73],[-15,-99],[-8,-12],[-6,-15],[3,-42],[11,-31],[12,-57],[-10,-57]],[[2489,8521],[141,-78],[18,-35],[8,-12],[44,-20],[64,4]],[[3388,8280],[25,-2],[45,-23],[-3,-44],[0,-44],[13,-19],[14,-6],[25,-35],[60,-68],[19,-84],[-1,-42]],[[3585,7913],[-1,-20],[-1,-26],[-8,-87]],[[3575,7780],[-19,-18],[-15,-33],[-2,-86],[20,-128],[-9,-37],[-19,-48],[-14,-59],[-43,-53],[-72,26],[-22,-17],[-22,-35],[-61,-35],[-36,-38],[-44,-23],[-66,2],[-20,-6],[-47,-44],[-17,5],[-16,15],[-15,5],[-12,13],[-17,44],[-88,-22],[-46,65],[-49,39],[-14,-34],[-5,-60],[2,-96],[-16,-80],[-43,-58],[-32,-100]],[[2716,6884],[-34,13],[-31,27]],[[2731,7814],[43,-35],[84,6],[59,-58],[51,13],[40,71],[19,116],[2,83],[25,45],[68,26],[49,26],[25,71],[9,138]],[[3205,8316],[38,-9],[33,-19],[112,-8]],[[2716,6884],[23,-67],[5,-95],[3,-33],[12,-9],[21,3],[50,50],[31,-7],[12,-19],[14,-12],[15,24],[14,30],[48,-15],[14,10],[13,3],[21,-53],[16,11],[17,-13],[20,11],[38,2],[19,16],[21,-35],[24,8],[0,-47],[6,-28],[3,-40],[7,-49],[13,-48],[15,-19],[18,-4],[4,-22],[7,-27],[7,-11],[1,-42],[-21,-57],[3,-80],[26,-167],[26,-55],[7,-32],[3,-50],[7,-29],[6,-33],[0,-49],[-3,-48],[-5,-48],[2,-20],[2,-9],[0,-61],[11,-41],[16,-28],[4,-48],[-10,-38],[-12,-29],[-12,-4],[-11,-8],[-4,-16],[-5,-17],[-28,-31],[-13,-22]],[[3237,5337],[-1,-46],[-4,-46],[-8,-25],[-41,-18],[-31,10]],[[3152,5212],[-20,12],[-41,3],[-67,-17],[-39,70],[-26,141],[-37,92],[-21,-15],[-19,-38],[-18,-29],[-21,-12],[-37,-69],[-38,-39],[-23,60],[-26,29],[-19,-34],[-33,-77],[-35,-56],[-18,-21],[-24,-9],[-24,31],[-8,16],[-9,12],[-12,36],[-8,50],[-15,34],[-18,11]],[[2496,5393],[-9,100],[-53,164],[-6,123],[-14,96],[-58,129],[-20,77]],[[4467,9778],[3,-90],[-15,-93],[-26,-71],[-1,-53],[33,-31],[19,1],[23,-5],[31,-20],[64,-8],[35,-23],[28,-89],[-18,-105],[-17,-27],[-15,-35],[-10,-54],[-5,-62],[4,-30],[5,-31],[-4,-208]],[[4601,8744],[-28,-14],[-17,-60],[-15,-87],[-12,-33],[-25,-50],[-18,-105],[-18,-51],[-5,-32],[10,-59],[11,-10],[17,-43],[-13,-79],[-74,-71],[-45,-22]],[[4369,8028],[-22,2],[-22,10],[-17,29],[-16,36],[-31,25],[-20,78],[6,47],[14,34],[16,52],[-6,62],[-8,11],[-17,-15],[-85,-104],[-40,-18],[-55,-74],[-20,-18],[-25,18],[-19,54],[-47,72],[-68,18],[-7,14],[-12,36]],[[3868,8397],[-5,21],[-11,36],[-27,29],[-30,10],[-10,171],[5,54],[24,75],[27,62],[51,24],[-14,77],[-15,142],[-38,64],[-38,-29],[-32,-11],[-18,45]],[[3737,9167],[-5,114],[34,55],[-19,116],[-15,70],[-5,96]],[[3727,9618],[15,8],[9,13],[6,-7],[36,22],[19,19],[24,37],[83,63],[83,99],[19,3],[38,-16],[55,0],[12,-5],[26,-22],[112,-26],[10,8],[14,-13],[68,13],[111,-36]],[[2088,498],[-2,-2],[-1,8],[3,-6]],[[2129,482],[2,15],[4,11],[5,-2],[2,-3],[-3,-6],[-6,-10],[-4,-5]],[[2008,533],[-2,-4],[-2,0],[-1,-4],[-3,3],[-4,6],[5,10],[5,-4],[2,-7]],[[2035,480],[0,9],[2,8],[2,20],[1,10],[6,18],[4,8],[4,-1],[-1,-13],[0,-10],[3,-4],[1,-3],[1,-9],[-9,-12],[-1,-7],[-1,-2],[-2,-5],[-2,-2],[-8,-5]],[[2208,578],[-3,-15],[-3,3],[-4,-2],[-6,-4],[-5,-2],[-4,-5],[-2,6],[4,3],[4,9],[4,5],[6,8],[10,7],[10,14],[-1,-10],[-5,-6],[-1,-8],[-3,0],[-1,-3]],[[1930,627],[-5,-8],[-2,9],[4,3],[3,3],[0,-7]],[[1977,630],[-2,-4],[0,8],[4,4],[-2,-8]],[[3548,1359],[18,-114],[21,-108],[15,-44],[17,-30],[21,-27],[10,-51]],[[3650,985],[-5,-94],[3,-175],[-8,-77],[-9,-39],[-7,-43],[-2,-40],[-4,-39],[-8,-30],[-2,-11]],[[3608,437],[-2,3],[-19,4],[-9,7],[-40,57],[-5,14],[-4,19],[-9,10],[-11,7],[-8,12],[-25,81],[-4,1],[-2,9],[-10,16],[-2,9],[-3,45],[-1,14],[-12,44],[-32,69],[-6,46],[-1,13],[-2,11],[-6,20],[-6,24],[-2,6],[-7,7],[-1,1],[-9,49],[-7,26],[-8,12],[-32,79],[-3,5],[-5,2],[-6,1],[-6,3],[-4,7],[-3,7],[-3,4],[-21,-2],[-10,4],[-5,16],[-6,13],[-13,12],[-15,6],[-9,-4],[-5,11],[-20,21],[-10,36],[-7,16],[-6,-2],[-11,4],[-40,43],[-9,18],[-7,22],[-99,108],[-15,6],[-1,39],[-19,27],[-209,77],[-86,-12],[-14,10],[-11,16],[-21,40],[-31,-50],[-14,-34],[-7,-50],[-7,-28],[-2,-13],[0,-49],[-3,-52],[1,-28],[5,-24],[0,-10],[-4,-13],[-3,-13],[-2,-16],[-1,-23],[1,-29],[3,-17],[3,-13],[3,-18],[4,11],[-1,-34],[-8,-56],[2,-19],[-18,-37],[-8,-24],[-6,-57],[-12,-43],[1,-14],[-7,-26],[1,-28],[6,-22],[7,-11],[-4,-23],[14,-12],[-8,-23],[-14,-30],[-6,-33],[4,0],[2,7],[1,-4],[4,-3],[-5,-13],[-8,-13],[-6,-15],[-6,-36],[-7,-20],[-15,-33],[1,67],[-2,28],[-6,14],[-13,-9],[-55,63],[-11,1],[-39,-16],[-5,-14],[-2,-24],[0,-33],[-4,0],[0,10],[-3,22],[-4,-31],[0,-13],[-7,12],[0,-11],[0,-12],[-20,11],[-4,5],[-4,9],[-5,5],[-7,-7],[11,0],[0,-12],[-35,-46],[-8,3],[-6,-9],[-6,0],[-6,6],[-7,3],[-4,-1],[-3,-3],[-7,-18],[-9,-12],[-19,-11],[-8,-10],[2,-1],[2,-1],[0,-2],[0,-8],[-5,1],[-13,-10],[0,-11],[11,0],[-7,-18],[-8,-14],[-8,-9],[-9,-4],[0,12],[3,5],[1,5],[1,6],[2,6],[-7,-3],[-2,-2],[-2,-7],[-6,16],[-6,6],[-7,-3],[-6,-7],[-2,-6],[0,-7],[-2,-6],[-5,-3],[0,-5],[-9,-29],[-2,33],[-18,21],[-5,33],[7,-8],[3,8],[-1,15],[-4,7],[-26,-10],[0,10],[4,7],[5,4],[6,2],[6,-1],[-12,13],[-42,-2],[-14,8],[-32,46],[-7,-15],[-2,15],[-2,44],[-3,-12],[-2,3],[-2,7],[-4,2],[-5,-6],[-2,-3],[-1,-5],[-3,-7],[-3,-10],[-1,-10],[-3,-10],[-4,-5],[-4,8],[-3,16],[-3,11],[-4,-12],[-32,74],[0,1]],[[1879,755],[15,17],[9,33],[4,42],[-1,20],[0,19],[5,23],[4,28],[17,87],[32,33],[16,-16],[12,14],[-3,43],[5,44],[24,53],[25,46],[10,88],[-7,98],[57,316]],[[2103,1743],[15,7],[14,19],[12,43],[15,34],[20,93],[8,120],[29,95],[94,118],[32,14],[77,79],[32,-10],[32,-96],[12,-12],[73,7],[47,-12],[41,1],[19,11],[32,85],[10,68],[36,78]],[[2753,2485],[47,-46],[54,46],[28,10],[24,44],[26,22],[29,-9]],[[2961,2552],[11,-36],[12,-32],[20,-39],[23,-22],[52,-1],[134,-67],[44,-69],[33,-76],[37,-62],[26,-67],[24,-80],[14,-35],[16,-27],[35,-80],[20,-21],[17,-25],[2,-49],[-14,-25],[-6,-48],[8,-44],[23,-20],[24,-6],[16,-9],[11,-38],[9,-106],[-4,-109]],[[3152,5212],[-7,-106],[-3,-21],[-2,-20],[16,-38],[9,-14],[-4,-64],[-40,-157],[-16,-75],[-8,-84],[0,-33],[3,-31],[-2,-36],[-46,-142],[-40,-100],[-92,-146]],[[2920,4145],[-13,10],[-11,17],[-24,81],[-9,20],[-11,15],[-13,4],[-10,-21],[-26,-67],[-65,-126],[-32,-89],[-33,-75],[-40,-37],[-11,-1],[-11,-6],[-30,-58],[-20,-13],[-19,-20],[-26,-69],[-27,-59],[-20,-28],[-47,-112],[-36,-50],[-11,-50],[-7,-165],[-17,-76],[-37,-50],[-41,-4]],[[2273,3116],[-46,9],[-43,-36]],[[2184,3089],[-23,98],[-6,11],[-8,5],[-14,18],[-7,6],[-24,0],[-12,12],[0,162],[8,46],[17,16],[16,21],[141,253],[14,40],[-8,106],[-14,40],[-56,225],[-72,41]],[[2136,4189],[-1,44],[12,36],[10,65],[7,63],[32,75],[8,60],[3,66]],[[2207,4598],[108,155],[15,45],[21,85],[15,106],[13,67],[9,72],[10,65],[62,66],[36,134]],[[2103,1743],[-45,150],[-63,-20],[-25,-77],[-20,19],[9,92],[-12,82]],[[1947,1989],[4,85],[8,84],[15,76],[51,186],[23,112],[2,15],[-2,22],[-4,13],[-4,7],[-2,-1],[-4,0],[-6,60],[1,64],[-5,43],[0,42],[67,86],[5,36],[7,34],[15,22],[8,8],[21,31],[37,75]],[[2273,3116],[7,-53],[11,-46],[19,-18],[20,22],[57,103],[15,18],[15,24],[24,61],[26,-45],[23,-79],[21,-53],[22,-41],[37,-16],[33,1],[31,-47],[17,-128],[14,-76],[32,-117],[5,-28],[9,-28],[9,3],[15,-5],[11,-37],[7,-46]],[[1947,1989],[-25,-49],[-4,-103],[-5,-41],[-11,-35],[-18,-22],[-52,69],[-29,5],[-13,31],[-2,25],[-1,53],[-5,62],[-7,59],[-31,75],[-39,43],[-6,18],[-9,42],[-7,17],[-39,13],[-17,62],[-7,74],[-15,66],[-25,23],[-18,0],[-14,13],[-5,45],[0,46],[2,33],[-6,27]],[[1585,3637],[24,1],[21,25],[8,38],[-3,42],[23,109],[49,26]],[[1707,3878],[31,-16],[28,-41],[30,0],[26,43],[19,-8],[16,-44],[18,-2],[17,13],[7,10],[7,7],[12,-21],[7,3],[7,31],[0,20],[26,49],[37,-9],[40,2],[19,14],[17,36],[-4,93],[4,97],[65,34]],[[2920,4145],[15,-116],[41,-79],[32,-99],[36,-72],[18,-19],[12,-42],[38,-79],[-4,-52],[-33,-52],[-37,-33],[-17,-26],[-11,-103],[12,-125],[1,-125],[-22,-82],[-2,-76],[-17,-52],[-23,-16],[0,-56],[13,-48],[8,-58],[-5,-95],[-14,-88]],[[2207,4598],[0,164],[-25,67],[-15,16],[-65,36],[-33,-2],[-15,-9],[-13,-20],[-9,-89],[-13,-74],[-30,-5],[-66,-45],[-37,-4],[-35,12],[-32,48],[-31,1],[-28,-59]],[[1760,4635],[2,100],[-11,75],[-18,74],[5,98],[-3,27],[-6,26],[-33,124],[-15,25],[-79,41],[-11,20],[-26,69]],[[1760,4635],[-20,-47],[-40,-75],[-6,-32],[-16,-40],[-14,-13],[1,-57],[15,-12],[12,-35],[2,-35],[1,-38],[4,-77],[-4,-76],[-7,-48],[-10,-40],[-15,-32],[-5,-23],[14,-24],[15,-1],[20,-52]],[[1288,1241],[-1,-3],[-2,2],[1,4],[2,-3]],[[1699,1374],[2,-6],[2,1],[8,-5],[-2,-8],[-3,-3],[-2,-4],[-3,-12],[-2,-6],[-4,18],[2,22],[2,3]],[[949,1819],[-2,-6],[-1,1],[-4,9],[-4,2],[-3,3],[-4,4],[-2,15],[-4,10],[-4,5],[-2,4],[4,8],[5,-6],[6,-9],[5,-5],[6,-3],[4,-5],[5,-10],[0,-11],[-5,-6]],[[1879,755],[-2,5],[-5,23],[-7,20],[-31,25],[-8,27],[-8,-12],[-2,21],[1,5],[1,7],[0,12],[-14,0],[4,10],[-6,9],[-4,2],[-5,1],[3,14],[4,10],[5,6],[6,2],[0,7],[-1,2],[-2,2],[3,29],[-3,27],[-7,21],[-8,11],[0,10],[7,14],[3,4],[5,4],[0,11],[-2,56],[-3,27],[-6,-7],[-4,0],[-6,19],[-25,-24],[-12,5],[10,6],[2,15],[-3,21],[-5,24],[2,11],[5,29],[4,15],[7,-16],[6,16],[7,23],[8,9],[0,-10],[-3,-17],[4,-6],[7,4],[3,13],[-1,14],[-3,14],[-4,12],[-3,9],[-32,57],[-41,43],[-5,15],[-4,22],[-9,-15],[-9,-30],[-7,-17],[0,-9],[3,0],[0,-11],[-9,-2],[-5,-3],[-3,-6],[-2,-13],[1,-15],[0,-11],[-7,-5],[3,-13],[2,-5],[3,-4],[-4,-11],[5,-15],[2,-7],[3,0],[3,16],[3,13],[1,14],[-3,22],[9,-21],[-3,-27],[-9,-24],[-7,-15],[3,-16],[-6,-8],[-9,-2],[-7,3],[-5,15],[0,15],[5,11],[8,4],[0,12],[-9,11],[-6,11],[-5,5],[-9,-6],[-3,42],[-19,32],[-23,12],[-16,-20],[-3,0],[-3,29],[-5,12],[-7,-6],[-7,-24],[-4,10],[-6,44],[4,22],[3,31],[-2,30],[-5,15],[-1,7],[1,2],[2,0],[1,2],[-1,5],[-1,3],[0,5],[2,10],[-3,0],[-3,-15],[0,-7],[-1,-12],[-3,6],[0,2],[-1,13],[-7,18],[-15,6],[-12,-16],[2,-39],[-5,11],[-5,3],[-5,2],[-6,5],[7,11],[0,12],[-12,-1],[-7,5],[-4,15],[-2,34],[4,-1],[2,1],[1,6],[-1,9],[-1,5],[-1,2],[-1,6],[-1,16],[-2,10],[-3,-1],[-1,-15],[-5,-14],[-10,-8],[-15,-4],[-6,-4],[1,-10],[3,-11],[4,-9],[3,-1],[4,4],[5,-1],[5,-13],[-5,-23],[-4,-23],[-6,-17],[-10,-1],[-27,34],[-5,10],[-3,0],[2,-25],[1,-9],[-14,-2],[-5,4],[-2,14],[2,14],[5,7],[14,6],[0,11],[-6,11],[-8,16],[-8,10],[-8,-10],[-7,-26],[-4,-26],[2,-23],[7,-16],[-2,-35],[20,-38],[4,-37],[-7,11],[-8,7],[-7,-5],[-4,-25],[-3,5],[-3,7],[-1,-7],[0,-5],[-2,-4],[-2,-5],[3,-3],[2,-8],[-27,-24],[-11,-19],[-9,-34],[-7,-35],[-10,-40],[-12,-24],[-14,12],[-2,-10],[-2,-6],[-2,-3],[-5,-3],[1,-5],[2,-11],[1,-6],[-7,-7],[-5,-1],[-4,5],[-2,14],[-6,-22],[-6,-4],[-7,10],[-6,16],[1,5],[1,12],[1,5],[-2,5],[-2,5],[-3,10],[39,0],[11,12],[6,16],[5,18],[7,21],[-7,21],[-10,-23],[-4,-8],[0,10],[5,14],[1,19],[-1,19],[-5,13],[-6,9],[-1,-5],[-1,-20],[-2,-7],[-6,1],[-6,6],[-3,6],[-5,-5],[-6,0],[-5,7],[-2,14],[2,6],[19,11],[-3,11],[11,-2],[3,2],[2,4],[3,8],[3,7],[-1,2],[20,4],[5,7],[-2,-25],[8,-2],[8,15],[1,23],[-5,9],[-11,3],[-3,10],[1,10],[4,9],[6,13],[4,12],[2,-11],[2,-7],[7,-15],[-3,27],[-1,33],[-3,14],[-6,4],[-6,-3],[-4,-7],[-9,-35],[-12,-18],[-4,1],[-3,17],[-7,-19],[-21,-15],[-7,-10],[-4,0],[-2,20],[-5,-6],[-7,-15],[-7,-10],[-3,22],[-4,-2],[-4,-12],[-4,-8],[-4,6],[-3,11],[-3,2],[-4,-19],[-4,0],[-6,14],[-9,13],[-11,6],[-9,-11],[0,11],[-6,-8],[-6,1],[-7,4],[-8,3],[-9,-8],[-11,-35],[-7,-12],[0,-11],[1,-14],[-7,-50],[-1,-35],[-18,22],[-9,8],[-9,4],[-9,-3],[-8,-5],[-5,1],[-3,17],[-36,-32],[-2,-11],[-2,-7],[-3,-4],[-2,3],[-7,16],[-4,3],[-11,6],[-6,0],[-6,-6],[-1,20],[-4,10],[-6,1],[-6,-9],[0,7],[-1,2],[-1,0],[-2,1],[3,10],[0,10],[-3,8],[-4,6],[0,9],[7,-6],[8,-5],[9,-1],[7,8],[4,16],[2,26],[6,18],[6,11],[5,2],[13,-2],[38,14],[19,-3],[10,7],[2,17],[1,21],[3,20],[11,7],[24,-35],[8,7],[8,-11],[7,1],[7,3],[6,-5],[14,32],[7,9],[45,3],[6,6],[3,-11],[9,-10],[10,-6],[10,-1],[18,5],[9,-6],[9,-21],[2,17],[3,9],[9,18],[-3,19],[-5,9],[-7,4],[-10,0],[4,11],[5,-4],[0,9],[-3,15],[-6,14],[3,1],[1,2],[2,3],[2,4],[3,-5],[4,4],[5,7],[5,6],[0,9],[-10,27],[-4,14],[-3,15],[6,-12],[4,12],[-3,4],[-1,5],[-1,6],[-2,7],[4,0],[9,1],[5,-1],[0,10],[-11,0],[0,11],[13,1],[5,-3],[3,-9],[4,8],[2,2],[3,-3],[2,-7],[4,0],[5,9],[12,-14],[5,5],[3,0],[1,-12],[3,-20],[1,8],[1,3],[-1,3],[-1,8],[2,7],[-1,5],[-2,5],[-3,4],[0,11],[4,2],[5,-2],[3,-4],[2,-7],[11,44],[3,11],[0,11],[-7,0],[5,16],[2,16],[9,-16],[8,-3],[5,8],[-4,23],[28,27],[16,9],[0,10],[-4,11],[-4,8],[-5,3],[-68,-25],[-26,2],[-9,-6],[1,-17],[0,-12],[-9,12],[-55,21],[-6,-4],[-7,-14],[-6,-3],[-5,1],[-16,9],[-13,-3],[-42,-34],[-6,5],[-3,0],[-1,-7],[-3,-16],[-4,4],[-5,2],[-6,0],[-7,-6],[-10,19],[-17,0],[-16,-14],[-10,-26],[-10,14],[-14,15],[-13,-3],[-2,-37],[-12,21],[-6,8],[-7,3],[-16,-4],[-6,4],[-5,12],[-9,34],[-4,9],[-8,-1],[-8,-17],[-3,11],[1,7],[-4,0],[-1,-15],[-6,-40],[-2,9],[0,3],[1,2],[1,9],[0,2],[-1,0],[-1,2],[-1,6],[2,6],[1,2],[-1,3],[-2,11],[-5,-8],[-14,-7],[-6,-7],[0,-10],[2,-17],[-3,-18],[-6,-14],[-8,-6],[3,-16],[1,-6],[-5,3],[-2,0],[-4,-3],[-3,12],[-9,-6],[-6,24],[-3,35],[0,28],[-3,26],[-4,21],[-2,23],[5,34],[5,0],[8,9],[9,15],[7,19],[-4,8],[-4,4],[-5,-3],[-5,-9],[-2,5],[-1,5],[-1,12],[4,-10],[6,18],[16,-15],[10,7],[0,11],[1,13],[1,14],[-2,17],[6,-4],[4,-9],[1,-14],[0,-18],[3,0],[3,17],[4,12],[4,3],[4,-10],[1,4],[1,2],[0,2],[1,4],[0,-27],[2,-7],[4,1],[5,-1],[5,-7],[3,-7],[3,-3],[7,7],[-1,-4],[-1,-2],[0,-1],[-2,-3],[8,-33],[7,-12],[8,5],[14,24],[11,12],[5,9],[5,8],[12,0],[6,7],[0,12],[-7,-3],[-2,-3],[-2,-6],[-4,50],[-4,26],[-6,12],[0,11],[24,14],[7,-4],[-6,-32],[6,4],[4,8],[8,21],[-8,8],[-3,11],[0,31],[1,7],[7,11],[3,9],[1,11],[1,20],[1,12],[-6,11],[-1,1],[-4,2],[-2,-4],[0,-6],[-1,-4],[-13,1],[-6,-4],[-2,-13],[-3,-24],[-7,-21],[-8,-11],[-8,7],[10,19],[1,21],[-6,14],[-12,0],[-1,-6],[-5,-12],[-6,-7],[-2,9],[1,15],[4,16],[9,29],[0,12],[2,17],[1,22],[-6,26],[-4,0],[-2,-45],[-12,-16],[-14,6],[-12,22],[-4,35],[4,33],[10,25],[12,15],[-6,24],[-10,11],[-2,-1]],[[7026,3779],[14,-23],[42,42],[16,-40],[2,-42],[-4,-36],[-13,-64],[5,-23],[-5,-20],[-18,-33]],[[7065,3540],[-21,-35],[-31,-22],[-9,-12],[-7,-18],[-2,-24],[-3,-53],[-5,-23],[-7,-12],[-25,-19],[5,-24],[0,-20],[-3,-20],[-6,-24],[2,-8],[2,-11],[-1,-14],[-3,-11],[-3,0],[-11,9],[-4,2],[-8,-8],[-7,-13],[-5,-19],[-5,-26],[8,5],[14,25],[6,3],[6,-12],[-1,-42],[6,-22],[-10,-7],[-12,-2],[-10,-5],[-7,-19],[5,-8],[13,-35],[-4,-7],[-4,-5],[-4,0],[-9,14],[-4,-7],[-3,-12],[-3,-6],[-2,-2],[-2,-4],[-4,-4],[-4,-1],[-3,4],[-7,15],[-1,4],[-10,-16],[9,-25],[26,-47],[-116,-44],[-25,-64],[-5,-7],[-7,-28],[-31,-81],[-11,-16],[-64,-27],[-16,17],[-31,-28],[-5,-1],[-4,-35],[-8,-9],[-22,8],[-5,-9],[-1,-20],[1,-19],[-2,-9],[-2,-1],[-1,-4],[-1,-3],[-3,-2],[-2,3],[-1,14],[-2,5],[-24,13],[-9,12],[-7,20],[-15,-27],[-6,-1],[-8,16]],[[6464,2590],[-41,87],[-61,55],[-57,2],[-57,-28]],[[6248,2706],[-57,85],[-31,27],[-18,73],[0,94],[21,63],[28,62],[26,76]],[[6217,3186],[74,34],[46,47],[48,15],[22,-16],[23,-8],[19,15],[18,22],[43,26],[32,69],[1,83],[14,63],[41,53],[33,120],[38,104],[36,1],[32,22],[30,-15],[2,-52],[-20,-46],[-11,-17],[4,-34],[9,-10],[8,-14],[31,-20],[37,1],[36,-13],[39,19],[14,1],[14,7],[22,25],[22,12],[28,33],[24,66]],[[7646,4233],[-175,-14],[-9,8],[-18,34],[-12,14],[-23,-11],[-8,-51],[-12,-52],[-13,-48],[-16,-25],[-18,-15],[-40,6],[-40,-8],[-15,-21],[-40,-13],[-22,-23],[-44,8],[-43,27],[-72,-30]],[[7026,4019],[-22,7],[-42,-35],[-18,7],[-16,35],[-8,13],[-14,6],[-1,7],[-12,48],[-4,9],[-13,23],[3,11],[-12,23],[-17,-5],[-32,-29],[-15,3],[-42,52],[-4,-1],[-3,-4],[-3,-1],[-9,20],[-2,4],[-14,9],[-31,9],[-7,5],[-6,9],[-7,15],[-9,29],[-6,7],[-6,-14],[-8,17],[-7,28],[-5,32],[-2,27],[-2,15],[-3,9],[-1,11],[8,33],[3,29],[3,17],[6,24],[8,21],[10,15],[13,6],[7,10],[6,23],[3,29],[-3,25],[6,19],[13,6],[58,-14],[7,7],[0,16],[0,21],[2,10],[-6,49],[0,35],[-3,98],[-6,46],[-9,41],[-1,66],[15,45],[37,4]],[[6803,5101],[14,17],[16,7]],[[6833,5125],[20,-72],[1,-46],[-8,-42],[0,-45],[22,-51],[15,-1],[41,26],[41,7],[23,-23],[5,2],[10,6],[5,-1],[17,-24],[16,-3],[21,-15],[22,-5],[24,-27],[22,-37],[23,-17],[10,-18],[12,-34],[5,1],[9,6],[12,-15],[13,-10],[16,27],[14,42],[18,8],[19,-3],[50,8],[49,46],[32,83],[14,69],[7,74],[-2,56],[-6,62],[7,25],[10,17],[26,14],[28,4]],[[7496,5219],[120,152],[18,13],[43,46],[16,-76],[-22,-102],[-26,-87],[-11,-112],[13,-123],[31,-91],[10,-53],[-4,-59],[-6,-61],[-10,-44],[-17,16],[-16,7],[-25,-169],[28,-100],[5,-69],[3,-74]],[[6070,4433],[-31,-123],[6,-94],[10,-1],[19,11],[10,2],[77,-40],[67,-95],[36,-24],[41,-46],[25,-108],[-3,-65],[-29,-183],[-3,-47],[-10,-38],[-8,-20],[-12,-48],[-27,-234],[-21,-94]],[[6248,2706],[-1,-48],[4,-47],[-7,-72],[-22,-36],[-33,2],[-33,-10],[-70,-59],[-65,-29],[-30,-34],[-47,-122],[-40,32],[-15,141],[-25,39],[-25,-81],[-63,-71]],[[5776,2311],[-23,82],[-28,64],[-18,30],[-20,13],[-42,-20],[-16,-8],[-19,-18],[-17,-7],[-9,23],[-7,-7],[-6,-4],[-5,-7],[-4,-15],[-4,-2],[-22,64],[-3,105],[-5,20],[-7,17],[-7,45],[4,48],[15,39],[12,48],[0,124]],[[5545,2945],[14,45],[10,14],[18,41],[1,65],[-16,98],[-4,75],[1,49],[7,104],[15,103],[26,281],[17,99],[29,67]],[[5663,3986],[19,48],[16,58],[41,111],[16,65],[7,83],[10,49],[17,26]],[[5789,4426],[69,41],[68,-23],[13,-21],[13,-15],[118,25]],[[7026,4019],[9,-22],[7,-35],[2,-38],[-18,-145]],[[6070,4433],[30,34],[27,58],[27,75],[11,10],[23,35],[37,96],[8,60],[-3,35],[-6,33],[-9,71],[-6,76],[12,61],[23,14],[44,-52],[44,23],[18,29],[20,20],[19,30],[19,23],[41,2],[18,18],[19,8],[35,-12],[34,24],[37,67],[41,33]],[[6633,5304],[41,-49],[49,-6],[24,-22],[22,-32],[34,-94]],[[4768,2497],[17,-95],[20,-88],[25,-47],[1,-163],[12,-91],[24,-45],[32,3],[20,-50],[-15,-100],[0,-90],[8,-89],[2,-45],[-2,-43],[-20,-44],[-22,-14],[-28,-48],[0,-3]],[[4842,1445],[-2,0],[-8,-4],[-7,-8],[1,8],[3,25],[-8,9],[-21,56],[-43,56],[-3,-12],[-15,20],[-23,-12],[-34,-40],[-16,-6],[-6,-6],[-16,-22],[-3,-6],[-5,-30],[-3,-7],[-16,-22],[-46,-101],[-56,-87],[-16,-34],[-45,-141],[-5,-24],[-2,-16],[-5,-10],[-11,-13],[-18,-47],[-18,-25],[-2,-42],[3,-51],[-1,-42],[-10,-21],[-16,-8],[-15,-13],[-5,-33],[3,2],[1,4],[-1,-10],[-10,-32],[-4,-20],[-2,-23],[0,-19],[-3,-11],[-9,0],[0,10],[5,29],[-3,43],[-8,41],[-10,17],[-8,7],[-7,11],[-6,3],[-8,-15],[-9,-39],[-6,-14],[-8,-7],[4,-3],[1,-3],[2,-6],[-6,-13],[-8,-34],[-6,-6],[-5,-3],[-18,-18],[-4,-8],[-16,-43],[-2,-16],[-4,-44],[-2,-11],[-2,10],[-13,50],[-2,22],[-5,7],[-7,-4],[-7,-8],[-12,-26],[-12,-38],[-11,-28],[-12,5],[7,10],[0,12],[-12,4],[-22,14],[-11,4],[-11,-6],[-18,-23],[-8,-5],[-20,18],[-11,3],[-10,-28],[-11,-4],[-24,1],[-15,-10],[-6,-2],[-6,4],[-12,15],[-5,3],[-12,-8],[-7,-20],[-4,-25],[-7,-23],[-6,-10],[-2,0],[-2,5],[-5,5],[-6,2],[-17,-2],[-35,22],[-10,1],[-33,-45],[-6,-6],[-5,-17],[-27,-54],[-23,4],[-47,27],[-20,25],[-32,51]],[[3650,985],[34,11],[34,-22],[32,2],[30,33],[30,18],[32,-4],[17,7],[13,30],[6,58],[7,50],[8,8],[8,5],[18,-24],[20,-19],[14,42],[-13,48],[-24,44],[-27,18],[-12,22],[-9,31],[-13,15],[-8,42],[-5,47],[-8,37],[-11,32],[-2,51],[20,9],[9,7],[23,37],[15,15],[7,-10],[2,-11],[4,-19],[18,-13],[12,47],[6,71],[17,49],[19,16],[18,30],[17,37],[18,28],[22,15],[66,15],[42,40],[43,9],[18,-14],[13,5],[19,25],[38,16],[50,93],[19,21],[39,6],[37,35]],[[4432,2126],[18,53],[14,21],[46,38],[29,36],[24,55],[15,20],[28,22],[10,18],[6,51]],[[4622,2440],[39,2],[18,15],[16,25],[36,37],[37,-22]],[[4739,5702],[-29,-12],[-34,18],[-11,-16],[-2,-36],[4,-56],[11,-48],[7,-82],[-7,-103],[15,-65],[12,-61],[-22,-66],[-32,-35],[-29,-41],[-63,-63],[-11,-85],[6,-70],[2,-37],[-21,-14],[-58,118]],[[4477,4948],[-11,-7],[-22,9],[-11,-8],[-27,-37],[-20,43],[-8,64],[-20,22],[-11,-2],[-22,9],[-7,25]],[[4318,5066],[4,54],[-33,28],[-7,17],[-17,18],[-28,5],[-10,19],[-9,31],[-7,14],[-9,8],[-27,52],[-58,88],[-11,89]],[[4106,5489],[59,242],[84,162],[36,134],[24,163],[84,189]],[[4393,6379],[10,-25],[11,-23],[28,-1],[27,-59],[27,-70],[24,-20],[41,-1],[10,-33],[4,-37],[7,-33],[72,-208],[23,-36],[26,-10],[23,-47],[13,-74]],[[5663,3986],[-22,56],[-14,82],[-19,75],[-27,29],[-43,-27],[-40,-55],[-23,-45],[-22,-132],[-15,-48],[-22,-109],[-28,-93],[-194,-321],[12,-292],[-28,-31],[-64,61],[-48,29],[-90,17]],[[4976,3182],[9,97],[3,83],[24,37],[-6,58],[-10,54],[-3,68],[5,68],[-14,106],[-84,3],[-31,78],[-37,242]],[[4832,4076],[14,67],[22,53],[46,177],[2,74],[-5,73],[2,74],[-36,113],[-25,115],[15,82],[10,86],[0,39],[2,38],[5,33],[7,30]],[[4891,5130],[119,-44],[58,88],[24,19],[169,260],[44,144]],[[5305,5597],[27,-5],[26,-31],[5,-14],[6,-34],[5,-13],[16,-16],[18,-7],[49,-85],[52,-16],[40,33],[86,-29],[26,-47],[26,-22],[47,38],[49,0],[45,-20],[41,-52],[19,-142],[-22,-151],[-12,-57],[-10,-61],[-14,-126],[-21,-145],[-2,-26],[-4,-23],[-12,-54],[-2,-66]],[[4739,5702],[9,-5],[16,-16],[3,-20],[2,-35],[5,-30],[14,-38],[16,-21],[10,-49],[7,-63],[42,-62],[12,-48],[-5,-37],[2,-36],[5,-34],[8,-38],[6,-40]],[[4832,4076],[-54,-49],[-27,18],[-22,52],[-14,19],[-31,-3],[-44,-32],[-30,10]],[[4610,4091],[-20,30],[-17,43],[-21,40],[-10,21],[0,77],[16,80],[-5,73],[-11,8],[-22,-10],[-26,18],[-25,37],[-7,81],[18,72],[9,80],[-17,142],[5,65]],[[5431,1895],[23,9],[21,-14],[22,-2],[25,16],[24,-18],[17,-45],[20,-31],[26,-1],[26,8]],[[5635,1817],[34,-82],[42,-46],[9,-21],[4,-33],[7,-14],[8,-2],[4,-15],[1,0]],[[5744,1604],[-1,1],[-5,1],[-5,0],[2,-39],[-6,-31],[-8,-28],[-7,-32],[-2,-35],[-1,-31],[-1,-31],[-7,-37],[-7,-67],[1,-71],[-3,-69],[-15,-61],[-3,-24],[2,-27],[10,-86],[2,-12],[4,-8],[8,-9],[3,-5],[2,-10],[2,-11],[1,-12],[-1,-14],[-3,-24],[-3,-15],[-2,0],[5,-13],[17,-4],[9,-9],[6,-17],[5,-24],[4,-27],[1,-22],[1,-36],[-3,-13],[-37,-18],[-10,1],[-40,15],[-9,-4],[-6,-5],[-2,-10],[-1,-11],[-2,-10],[-5,-5],[-2,0],[-4,3],[-14,5],[-7,6],[-7,11],[-6,19],[-6,-15],[7,-21],[0,-14],[-5,-11],[-3,-12],[-1,-23],[-1,-230],[1,-46],[-11,-9],[-21,20],[-10,-10],[0,-1],[-4,-56],[-9,-5],[-12,9],[-17,-15],[-12,-46],[-3,-113],[-6,-47],[-1,0],[-9,-4],[-30,55],[-15,18],[-17,1],[-8,5],[-6,13],[-1,19],[1,21],[0,20],[-6,19],[-11,-4],[-10,-10],[-10,-5],[-5,4],[6,22],[22,99],[6,12],[-1,27],[-14,111],[-37,150],[-7,23],[-6,27],[-6,49],[-7,21],[-9,19],[-6,20],[-6,36],[1,25],[14,52],[4,13],[5,8],[6,5],[6,1],[3,6],[6,38],[4,11],[9,13],[5,9],[3,14],[3,34],[6,10],[2,8],[4,7],[20,18],[5,7],[25,75],[3,17],[6,1],[56,88],[8,5],[6,12],[6,28],[5,33],[3,24],[0,21],[-2,15],[-3,14],[-2,17],[-1,11],[1,100],[-2,24],[-5,28],[-31,107],[-18,45],[-19,34],[-20,12],[-19,-17],[-18,-39],[-9,-29]],[[5364,1677],[-9,33],[1,66],[43,120],[9,15],[11,-5],[12,-11]],[[5630,8043],[-14,-19],[0,-11],[4,0],[0,-11],[-7,-21],[6,-27],[10,-25],[8,-14],[9,-8],[11,-63],[-18,-63],[-9,-52],[0,-59],[-23,-77],[-43,-21],[-3,-81],[-4,-5],[-4,-4],[-8,-16],[-43,-67],[-32,-36],[-9,1],[-9,16],[-11,12],[-11,7],[-15,18],[-13,26],[-42,27],[-43,-9],[-14,-38],[-23,-120],[-16,-64],[-13,-46],[-16,-42],[-18,-19],[-10,-6],[-28,-28],[-15,-39],[-21,-102]],[[5143,6957],[-26,19],[-27,-5],[-24,5],[-9,17],[-5,32],[-4,4]],[[5048,7029],[6,110],[0,41],[5,38],[45,160],[12,115],[0,59],[-13,72],[-9,9],[-18,8],[-39,54],[-87,35],[-16,24],[-15,57],[-21,106],[-5,43],[8,104],[1,159],[7,48],[11,33],[8,39],[-5,45]],[[4923,8388],[163,-106],[32,14],[17,-23],[75,-134],[18,-71],[17,-12],[40,7],[20,-9],[70,-2],[40,-46],[22,12],[19,38],[24,36],[16,65],[9,73],[21,30],[19,-16],[14,-36],[7,-38],[8,-33],[56,-94]],[[4818,8679],[27,-111],[7,-59],[3,-61],[9,-60],[40,11],[19,-11]],[[5048,7029],[-21,-17],[-50,-9],[-6,-72],[7,-18],[-2,-27],[-5,-35],[-1,-31],[-14,-43],[-41,-58],[-24,-7],[-45,31],[-78,-90],[-42,-5],[-21,5],[-31,-28],[-80,33],[-51,-39],[-50,-53],[-82,-23],[-29,-33]],[[4382,6510],[-1,81],[14,66],[10,39],[2,51],[-7,47],[0,19],[-2,18],[-9,24],[-13,4],[-13,31],[-22,114],[-5,76]],[[4336,7080],[41,54],[11,6],[9,11],[15,60],[12,66],[8,12],[1,41],[-4,41],[-6,42],[-8,39],[-13,51],[-7,59],[2,57],[-4,56],[-12,59],[-4,68],[11,63],[6,63],[-25,100]],[[4601,8744],[14,-40],[19,3],[12,-5],[8,-22],[18,-7],[17,10],[16,-10],[13,-22],[5,-24],[9,-13],[60,-44],[11,31],[9,19],[2,9],[2,12],[1,27],[1,11]],[[7041,7885],[-62,-17],[-4,-19],[-3,-23],[-10,-13],[-12,-8],[-16,-30],[-16,-25],[-7,-41],[7,-49],[-10,-42],[-16,-38],[-5,-18],[-1,-12],[-4,-71],[2,-58],[14,-41],[62,-34],[14,-29],[14,-33],[12,-9],[-3,-58],[-16,-30],[-52,-68],[-12,-32],[0,-53],[2,-53],[-2,-58],[4,-56],[15,-43],[-5,-54]],[[6931,6770],[-21,-21],[-46,-9],[-23,4]],[[6841,6744],[-52,62],[-55,41],[-53,-31],[-32,45],[-32,58],[-30,34],[-19,68],[1,90],[-43,380]],[[6526,7491],[-49,130],[2,42],[6,31],[2,53],[-1,53],[2,55],[-3,54],[-9,45],[0,50],[9,39],[11,30],[8,48],[-1,55],[0,7]],[[6503,8183],[25,-10],[21,-17],[12,0],[23,14],[10,-5],[22,-47],[11,0],[20,15],[20,-13],[13,-3],[6,11],[39,5],[8,13],[20,44],[6,9],[17,12],[7,-1],[3,-7],[8,-26],[4,-10],[5,7],[10,0],[5,3],[4,7],[5,11],[5,10],[6,5],[11,29],[2,9],[2,4],[12,10],[36,17],[9,13],[8,17],[10,8],[60,1],[42,22],[4,7],[9,18]],[[7043,8365],[-14,-193],[-2,-80],[5,-146],[9,-61]],[[6526,7491],[-15,-32],[-18,-18],[-24,-6],[-21,-12],[-5,-20],[-2,-46],[6,-18],[-3,-27],[-11,-16],[-43,4],[-19,-32],[-15,-49],[-16,-28],[-18,-6],[-40,76],[-29,130]],[[6253,7391],[-9,96],[-18,77],[-70,10],[-120,194],[-35,7],[-35,-13],[-38,8],[-34,34],[-27,39],[-44,34],[-29,41],[-23,12],[-7,12],[-6,46],[9,42]],[[5767,8030],[11,8],[11,12],[22,4],[21,17],[19,25],[8,14],[21,53],[41,54],[22,99],[30,71],[27,87],[1,9]],[[6001,8483],[58,2],[19,-12],[12,-26],[6,-8],[10,-8],[13,-3],[9,-6],[12,-33],[9,-16],[22,-16],[2,-9],[12,-30],[10,-10],[21,6],[9,-6],[3,8],[7,7],[4,7],[4,12],[6,43],[7,26],[7,26],[9,21],[10,15],[4,-26],[9,-15],[10,0],[9,18],[3,-11],[14,6],[0,-100],[10,-27],[27,-31],[7,-13],[5,-16],[9,-37],[21,20],[24,-7],[63,-49],[6,-2]],[[5138,9271],[-21,-107],[-2,-81],[8,-77],[2,-46],[-2,-46],[2,-37],[7,-33],[4,-46],[4,-96],[-10,-18],[-27,16],[-10,-10],[0,-2],[-16,-24],[-23,-9],[-23,6],[-16,20],[-9,23],[-4,6],[-24,7],[-5,8],[6,20],[-17,19],[-8,14],[-4,15],[-1,28],[-3,29],[-4,23],[-6,13],[-6,-23],[-13,-18],[-28,-24],[-17,-39],[-6,-6],[-13,-2],[-6,-6],[-4,-13],[3,-28],[-8,-19],[-11,-14],[-9,-15]],[[4467,9778],[60,-19],[60,39],[19,4],[9,-5],[15,-18],[18,-14],[69,-9],[27,7],[27,19],[9,11],[20,35],[19,26],[15,44],[12,54],[4,47],[7,-6],[15,-6],[6,-10],[2,10],[2,2],[3,0],[4,0],[4,-19],[6,-14],[3,-11],[-2,-11],[0,-10],[19,-36],[12,-11],[16,2],[5,8],[8,21],[6,4],[8,-3],[5,-7],[11,-23],[0,-11],[-28,8],[-13,-3],[-11,-20],[-5,-25],[-5,-35],[-3,-36],[0,-30],[3,-24],[14,-60],[16,-47],[28,-55],[0,-11],[-7,0],[3,-20],[5,-26],[7,-22],[15,-17],[15,-43],[8,-14],[32,-29],[22,-8],[9,-13],[16,-37],[19,-24],[8,-6]],[[6841,6744],[-1,-81],[-11,-61],[-24,0],[-24,9],[-28,-14],[-24,-40],[-25,9],[-25,44],[-23,-32],[-20,-132],[5,-50],[36,3],[38,22],[11,-31],[-6,-43],[-10,-5],[-10,1],[-20,-25],[-14,-53],[-25,-80],[-6,-167],[-12,-54],[6,-61],[19,-42],[17,-26],[12,-38],[-4,-26],[-19,-28],[-6,-13],[-4,-14],[-5,-11],[-7,-5],[3,-17],[1,-27],[0,-54],[7,-45],[3,-48],[-2,-28],[-1,-30],[3,-25],[3,-26],[-5,-53],[-11,-43]],[[5305,5597],[20,56],[23,41],[17,51],[13,61],[16,58],[18,52],[45,83],[38,89],[15,130],[-1,38],[-5,34],[-19,23],[-25,106],[-15,116]],[[5445,6535],[122,58],[87,10],[77,69],[16,40],[11,61],[10,96],[14,92],[19,26],[20,15],[60,-19],[19,19],[68,42],[49,16],[44,-6],[44,15],[19,24],[18,34],[7,6],[8,0],[19,11],[19,18],[31,103],[27,126]],[[5767,8030],[-9,39],[-18,30],[-28,2],[-3,5],[-3,-12],[-18,-20],[-58,-31]],[[5138,9271],[16,-12],[24,-7],[22,5],[11,10],[20,28],[33,13],[55,54],[12,4],[13,10],[21,40],[11,6],[0,-11],[-2,-10],[-3,-10],[-4,-8],[-5,-5],[1,-24],[-10,-49],[2,-27],[4,0],[1,39],[5,34],[7,29],[7,19],[6,10],[2,2],[32,-66],[0,21],[3,0],[40,-117],[7,-46],[0,-65],[-2,-16],[-4,-26],[-1,-7],[0,-53],[2,-24],[5,-27],[23,-67],[14,-21],[17,-76],[8,-16],[26,-33],[15,-8],[3,-7],[2,-13],[0,-16],[2,-19],[4,-8],[6,-4],[6,-7],[3,-7],[5,-19],[2,-6],[6,-5],[9,-3],[5,-9],[10,-9],[13,7],[22,28],[27,57],[5,15],[1,15],[8,29],[1,10],[1,4],[4,33],[-1,3],[7,14],[7,-2],[9,-8],[11,-4],[45,0],[41,-25],[77,-90],[16,-31],[9,-51],[1,-70],[3,-28],[9,-11],[11,-6],[20,-28],[10,-10],[9,0]],[[5445,6535],[-5,35],[-10,22],[-10,45],[0,62],[4,90],[-22,50],[-21,-15],[-22,-22],[-25,-12],[-24,-5],[-41,19],[-49,-9],[-41,68],[-36,94]],[[8768,8936],[8,-92],[3,-67],[6,-39],[5,-17],[9,-56],[15,-111],[-14,-108],[-43,-50],[-46,-115],[-32,-151]],[[8679,8130],[-31,-7],[-31,-16],[-36,10],[-35,-8],[-19,-22],[-16,-33],[-6,-62],[3,-68],[-13,-65],[-21,-49],[-10,-63],[-1,-71],[-24,-83],[-45,57],[-40,28],[-41,-27],[-45,-68],[-48,-41],[-35,72],[7,136],[13,57],[-4,52],[-18,15],[-65,24],[-41,53]],[[8077,7951],[8,64],[50,133],[12,16],[10,23],[5,33],[8,33],[28,42],[14,74],[-16,40],[-20,23],[-5,28],[-7,26],[-10,17],[-10,21],[-10,55],[-4,63],[-14,82],[-1,5]],[[8115,8729],[44,84],[14,11],[11,14],[5,4],[19,6],[6,5],[10,18],[8,28],[5,34],[2,35],[6,8],[30,62],[8,30],[55,-54],[7,-2],[15,2],[14,14],[4,0],[0,-6],[0,-12],[0,-13],[2,-10],[6,-6],[15,-4],[7,-6],[21,-44],[6,-6],[5,7],[21,41],[17,53],[7,13],[21,19],[37,-32],[19,13],[7,8],[7,3],[8,-3],[7,-8],[17,11],[8,-1],[7,-10],[9,-19],[12,-2],[26,3],[92,-82],[6,1]],[[8813,7611],[-3,-56],[-9,-53],[13,-159],[-21,-31],[-22,-23],[-17,-27],[-17,-33],[-33,-44],[-76,-59],[-17,-86],[19,-51],[11,-44],[13,-33],[44,-17],[17,-14],[16,-25],[8,-28],[7,-33],[9,-17],[11,-7],[20,-20],[13,-49],[13,-64],[15,-58]],[[8827,6580],[-14,-39],[-17,-23],[-14,1],[-7,-3],[-12,-13],[-12,-37],[-19,-15],[-39,16],[-18,-18],[42,-123],[74,-70],[-7,-12],[-5,-42],[1,-216],[-5,-75],[-17,-64]],[[8758,5847],[-10,-9],[-20,-8],[-20,-2],[-71,-85],[-11,-71],[3,-72],[-15,-59],[-36,-53],[-10,-28],[-16,-34],[-64,-26],[-21,-30],[-21,-37],[-45,4],[-44,44],[-13,24],[-30,102],[-51,120],[-20,29],[-42,24],[-83,-33]],[[8118,5647],[-22,91],[-24,65],[-31,8],[-39,44],[-51,112],[-16,23],[-15,-20],[-15,-26],[-47,-48],[-47,16]],[[7811,5912],[2,99],[18,82],[12,66],[-16,47],[-22,21],[-21,35],[-9,28],[-7,33],[-2,43],[1,44],[-35,109],[-89,4],[-28,33],[4,91],[16,85]],[[7635,6732],[86,-24],[18,7],[23,42],[22,50],[30,33],[65,54],[15,43],[12,57],[-1,33],[-35,7],[-15,15],[-34,19],[-33,41],[-13,98],[-14,217],[-17,96]],[[7744,7520],[84,99],[21,13],[22,5],[31,22],[16,91],[18,18],[23,1],[23,17],[55,110],[40,55]],[[8679,8130],[10,-123],[28,-94],[18,-30],[15,-44],[11,-62],[16,-52],[21,-49],[15,-65]],[[7811,5912],[-33,27]],[[7778,5939],[-43,3],[-42,16],[-78,6],[-10,13],[-20,16],[-5,2],[-2,-5],[-17,-12],[-20,-22],[-10,-5],[-49,-39],[-41,25],[-28,37],[-19,-14],[-24,-70],[-36,-28],[-80,-29],[-41,-1],[-40,24],[-41,6],[-20,-27],[-22,-13],[-28,12],[-27,-14],[-52,-45],[-14,-27],[-9,-43],[-14,-16],[-14,2],[-8,-25],[-6,-27],[-6,-8],[-31,-27],[-9,-50],[7,-49],[7,-30],[-14,-21],[-14,-6],[-12,-18],[-8,-91],[-11,-13],[-3,-1],[-4,-9],[-2,-38],[2,-37],[4,-7],[5,-11],[4,-98]],[[6931,6770],[14,-20],[15,-15],[16,-6],[16,-10],[57,-78],[20,-19],[19,-28],[8,-27],[9,-21],[32,-22],[30,-37],[32,-9],[31,8],[31,-6],[30,8],[28,33],[58,32],[23,57],[20,70]],[[7420,6680],[28,24],[30,-6],[26,7],[21,45],[25,23],[85,-41]],[[7744,7520],[-7,101],[6,108],[-33,193],[-6,113],[-13,106],[-19,99]],[[7672,8240],[59,90],[18,-19],[16,-4],[14,10],[17,23],[19,40],[7,5],[17,4],[8,7],[6,10],[31,95],[36,63],[6,6],[8,-3],[23,-19],[13,5],[20,32],[8,7],[11,4],[12,9],[12,14],[10,17],[20,50],[11,18],[13,7],[14,2],[9,7],[5,9]],[[7744,7520],[-11,-4],[-20,-16],[-54,1],[-26,-12],[-26,-18],[-22,-1],[-44,32],[-44,3],[-22,28],[-32,84],[-16,14],[-3,-6],[-7,-14],[3,-39],[-8,-21],[-10,-1]],[[7402,7550],[-26,98],[-35,56],[-17,-29],[-6,-65],[-8,-19],[-11,-8],[-31,10],[-122,114],[-35,84],[-7,94],[-22,30],[-9,-29],[-11,-21],[-11,1],[-10,19]],[[7043,8365],[5,8],[6,3],[17,-3],[10,-8],[16,-31],[12,-4],[8,7],[15,21],[10,4],[6,5],[28,39],[3,6],[2,7],[3,5],[7,4],[32,-18],[8,-17],[13,-41],[31,-63],[20,-26],[21,-10],[10,8],[11,12],[10,4],[14,-24],[6,-2],[12,2],[4,-3],[31,-58],[10,-10],[10,-5],[8,15],[33,26],[13,3],[30,-65],[15,-24],[21,-9],[9,3],[15,15],[12,7],[19,17],[12,18],[24,16],[27,41]],[[9222,6608],[11,-90],[-2,-76],[-1,-38],[8,-60],[8,-16],[18,-17],[34,55],[35,34],[16,-9],[8,-13],[17,-18],[11,0],[17,-29],[11,-59],[16,-48],[47,-52],[33,-18],[3,-23],[3,-24],[49,-18],[51,16],[39,-29],[41,-12],[93,51],[20,-12],[9,-15]],[[9817,6088],[0,-7],[-4,-20],[-17,-82],[-2,-21],[-1,-27],[1,-22],[2,-21],[-1,-19],[-5,-18],[0,-1],[-3,-35],[2,-30],[0,-29],[-9,-32],[-10,-17],[-27,-29],[-11,-7],[-14,3],[-36,42],[-12,4],[-29,-18],[-12,-3],[-11,3],[-8,0],[-8,-7],[-11,-16],[-6,-19],[3,-19],[14,-39]],[[9602,5602],[-74,-47],[-19,9],[-9,8],[-31,7],[-25,20],[-20,7],[-20,-5],[-15,-27],[-13,-32],[-19,0],[-45,21],[-23,36],[-30,74],[-36,39],[-41,5],[-22,-41],[-20,-59],[-17,-15],[-31,-14],[-13,-12],[-4,-47],[19,-28],[21,-20],[4,-49],[-4,-55],[-1,-55],[-13,-33],[-60,-59]],[[9041,5230],[-97,-51],[-17,-33],[-19,-26],[-25,-19],[-22,-33]],[[8861,5068],[-2,82],[4,79],[5,62],[0,24],[-3,22],[3,102],[-19,66],[-13,30],[-9,44],[-16,44],[-16,36],[-22,88],[-15,100]],[[8827,6580],[101,-47],[161,107],[57,-1],[24,-15],[24,11],[28,-27]],[[8118,5647],[-15,-61],[-2,-36],[8,-47],[3,-14],[4,-30],[1,-24],[-1,-49],[11,-50],[10,-25],[15,-61],[3,-70],[-6,-64],[-37,-106],[-16,-124],[12,-92],[11,-36],[6,-7],[11,-22],[7,-38],[3,-42]],[[8146,4649],[-25,-43],[-64,-59],[-65,-95],[-34,-23],[-89,8],[-26,17],[-18,4],[-51,-17],[-29,-35],[-3,-45],[-1,-48],[-13,-52],[-22,-23],[-60,-5]],[[7496,5219],[9,49],[4,54],[-11,120],[3,42],[6,40],[3,79],[8,31],[25,20],[37,-5],[7,7],[5,27],[5,31],[23,22],[26,-1],[24,41],[15,72],[8,16],[25,-10],[13,-2],[27,29],[20,58]],[[8230,4323],[3,-53],[-20,-27],[-16,-5],[-17,-13],[-28,-32],[-11,-39],[-5,-57],[-10,-88],[-6,-91],[6,-175],[-3,-88],[-9,-37],[-9,-34],[-25,-193],[-21,-58],[-25,-43],[-5,-38],[5,-45],[5,-61],[11,-48]],[[8050,3098],[-33,-38],[-183,11],[-58,-29],[-6,-36],[-25,-80],[-41,-8],[-59,-108],[-25,-24],[-57,-96],[-24,-53],[-51,-159]],[[7488,2478],[-24,66],[-17,83],[-19,128],[-2,24],[-4,46],[-9,120],[4,173],[-8,38],[-9,7],[-10,12],[-13,31],[-15,15],[-5,-21],[-5,-19],[-25,26],[-20,45],[-17,14],[-17,20],[-34,68],[-31,81],[-29,32],[-31,3],[-42,16],[-41,54]],[[8146,4649],[27,-82],[35,-62],[6,-63],[-6,-64],[6,-44],[16,-11]],[[8861,5068],[-38,-73],[-43,-40],[-85,23],[-19,-15],[-16,-29],[-21,-20],[-23,-6],[-10,-18],[-6,-74],[-12,-22],[-46,2],[-9,-58],[16,-62],[4,-68],[-22,-45],[-31,-82],[-37,-49],[-89,16],[-80,-72],[-6,-21]],[[8288,4355],[-29,-10],[-29,-22]],[[8944,3760],[-15,-106],[-6,-17],[-6,-21],[0,-50],[3,-49],[-2,-73],[-16,-58],[-20,-3],[-36,61],[-52,72],[-32,58],[-24,23],[-36,24],[-38,37],[-34,61],[-30,75],[-36,40],[-44,-42],[-46,-28],[-56,11],[-54,49]],[[8364,3824],[-1,36],[2,36],[0,58],[-2,57],[-13,88],[-18,215],[-44,41]],[[9041,5230],[0,-121],[16,-81],[61,-87],[21,-80],[-15,-116],[-37,-70],[-29,-72],[-48,-171],[-9,-50],[-11,-43],[-33,-57],[-56,-75],[-9,-23],[-5,-67],[3,-35],[19,-101],[2,-20],[1,-41],[-5,-56],[9,-80],[28,-24]],[[4143,7198],[-7,-130],[-7,-91],[0,-108],[4,-95],[-7,-91],[-61,-17],[-38,-39],[-24,-134],[-13,-135],[-15,-135],[13,-135],[41,-119],[15,-61],[20,-227],[42,-192]],[[4318,5066],[-18,-105],[21,-135],[-1,-92],[-44,-99],[-20,-24],[-47,4],[-45,-30],[-43,-59],[-45,-29]],[[4076,4497],[-12,64],[-16,57],[-14,61],[-11,65],[-1,92],[6,92],[2,87],[-2,85],[-28,155],[-52,88],[-29,22],[-10,13],[-22,40],[-22,0],[-10,-32],[-6,-42],[-5,-83],[-7,-29],[-23,8],[-30,55],[-25,20],[-53,-104],[-19,-60],[-24,-33],[-39,39],[-33,-36],[-31,-61],[-23,4],[-18,43],[-17,23],[-45,36],[-26,-8],[-55,-39],[-19,15],[-74,148],[-23,32],[-23,23]],[[3575,7780],[41,4],[41,-16],[153,-165],[15,-47],[13,-54],[17,-46],[19,-35],[9,-10],[23,-47],[16,-22],[12,-41],[5,-54],[35,-63],[38,11],[2,41],[6,44],[9,9],[11,-1],[16,-15],[16,-21],[71,-54]],[[4336,7080],[-49,10],[-144,108]],[[3585,7913],[54,59],[62,114],[25,104],[19,26],[50,-13],[51,65],[22,129]],[[3460,8776],[-28,-90],[-19,-52],[-8,-83],[-17,-129],[0,-142]],[[3205,8316],[-127,28],[-90,101],[-20,44]],[[2968,8489],[17,38],[8,22],[4,22],[2,26],[1,33],[1,15],[5,31],[1,20],[-3,8],[-10,16],[-1,13],[5,20],[12,10],[23,3],[3,7],[9,30],[3,7],[5,3],[79,70],[111,170],[63,71],[19,35],[5,7],[50,38]],[[3380,9204],[29,-68],[32,-32],[10,-83],[19,-110],[-10,-135]],[[4076,4497],[-10,-44],[-30,-82],[-12,-53],[-8,-125],[-18,-68],[-12,-84],[-3,-59],[-9,-55],[-4,-130],[19,-123],[7,-11],[6,-18],[4,-65],[8,-62],[35,-104],[21,-48],[23,-3],[62,33],[82,14],[41,-5],[41,25],[40,39],[40,22],[39,-16]],[[4438,3475],[7,-82],[17,-65],[25,-23],[24,-32],[20,-68],[18,-78],[21,-48],[17,-58],[6,-90],[-13,-82],[-11,-35],[-9,-41],[-3,-72],[1,-47],[20,-69],[12,-25],[20,-52],[12,-68]],[[4432,2126],[-12,64],[-36,144],[-30,80],[-43,112],[-59,156],[-11,102],[2,24],[-4,78],[-22,18],[-51,6],[-24,-36],[-16,-48],[-25,-84],[-53,-48],[-81,-12],[-79,-24],[-49,-48],[-27,-74],[-62,-166],[-63,-210],[-49,-157],[-13,-106],[3,-56],[32,-36],[31,-6],[8,-42],[-2,-48],[-16,-60],[-74,-180],[-59,-110]],[[6464,2590],[-8,-4],[-9,2],[-9,0],[-8,-15],[-23,-71],[-18,-43],[-5,-21],[-4,-41],[-3,-7],[-4,-5],[-4,-7],[-3,-15],[-6,-57],[8,-13],[6,-17],[4,-23],[0,-34],[-3,0],[-4,18],[-4,3],[-5,-11],[-2,-26],[2,-26],[4,-22],[9,-34],[3,-19],[1,-14],[-1,-38],[-3,-47],[0,-20],[7,-16],[6,8],[5,-8],[5,-13],[5,-8],[5,3],[12,14],[7,4],[6,-8],[-2,-18],[-6,-39],[0,-25],[1,-13],[8,-22],[14,-31],[2,-13],[0,-40],[2,-16],[1,-15],[9,-25],[3,-13],[-6,-6],[-4,-9],[-1,-21],[1,-22],[2,-14]],[[6457,1617],[-9,-15],[-15,-10],[-84,-94],[-86,-45],[-32,-35],[-37,-58]],[[6194,1360],[-44,97],[-49,66],[-38,49],[-16,-24],[-21,65],[-44,107],[-40,66],[-35,16],[-16,91],[-19,25],[-16,-33],[-6,-107],[-35,-58],[-43,-49],[-28,-67]],[[5635,1817],[13,58],[19,45],[36,113],[29,137],[20,75],[24,66]],[[7488,2478],[7,-188],[15,-40],[17,-34],[27,-66],[6,-34],[-5,-127],[47,-202],[23,-30],[0,-1]],[[7625,1756],[-37,-61],[-20,-22],[-20,-9],[-18,-16],[-52,-76],[-112,-103],[-169,-79],[-106,-50],[-28,-3],[-80,67],[-28,-5],[-11,-9],[-85,-10],[-37,12],[-31,41],[-16,39],[-55,143],[-26,35],[-99,73],[-34,11],[-18,-5],[-35,-33],[-51,-79]],[[5545,2945],[-40,1],[-49,-9],[-24,-98],[-29,-165],[-36,-205],[0,-124],[16,-116],[11,2],[34,-16],[15,-30],[4,-21],[7,-90],[-8,-82],[-15,-97]],[[5364,1677],[-20,-60],[-8,-15],[-8,-6],[-5,-10],[-18,-49],[-8,-16],[-20,-11],[-43,-5],[-19,-17],[-6,-15],[-6,-30],[-6,-10],[2,11],[1,8],[-2,7],[-4,7],[-6,-25],[-7,-19],[-5,-19],[3,-25],[8,26],[12,-8],[1,25],[3,-2],[2,-4],[2,-6],[1,-8],[2,11],[1,11],[0,11],[-3,10],[7,11],[3,-10],[2,-15],[4,-9],[6,5],[5,9],[5,5],[7,-7],[-31,-35],[-14,-27],[-8,-37],[1,-17],[7,12],[23,67],[7,11],[8,5],[-20,-50],[-3,-13],[-4,-29],[-3,-12],[-3,-16],[0,-21],[-1,-17],[-4,-8],[-5,-3],[-8,-14],[-4,-3],[-17,-3],[-7,3],[-16,37],[-5,6],[-7,-4],[-5,-11],[-1,-14],[5,-2],[4,-4],[18,-19],[-22,15],[-23,7],[-4,-4],[-12,-17],[-3,-7],[-2,-11],[-5,-7],[-11,-10],[-14,-27],[-1,-5],[-5,7],[-8,30],[-6,7],[-7,6],[-132,195],[-15,13],[-17,28],[-10,9],[-8,2],[-7,-1]],[[4768,2497],[-1,75],[2,36],[14,49],[8,16],[7,20],[8,67],[-3,43],[-14,80],[-2,80],[16,58],[27,-5],[27,-21],[51,21],[68,166]],[[4382,6510],[5,-32],[2,-33],[-2,-34],[6,-32]],[[4438,3475],[172,616]],[[7402,7550],[17,-235],[-4,-233],[-17,-92],[-6,-51],[-2,-53],[11,-107],[19,-99]],[[9403,6832],[-69,-57],[-65,-23],[-28,-30],[0,-61],[-19,-53]],[[8813,7611],[61,26],[62,16],[10,114],[8,191],[12,122],[63,76],[85,84],[85,84],[52,68],[34,27]],[[9285,8419],[-2,-37],[4,-51],[9,-45],[10,-22],[22,-8],[23,-26],[20,-39],[16,-48],[6,-31],[3,-30],[1,-32],[3,-36],[5,-32],[22,-80],[5,-30],[1,-27],[3,-110],[-1,-13],[-11,-45],[-3,-10],[4,-36],[-23,-60],[-7,-33],[1,-38],[-3,6],[-2,2],[-3,1],[-3,3],[2,-7],[1,-5],[1,-11],[-12,-3],[-12,-19],[-18,-49],[3,-21],[11,-29],[21,-42],[0,-11],[-1,-3],[-7,-61],[-5,-18],[-3,-26],[5,-25],[14,-31],[23,-71],[8,-40],[0,-3],[-9,-18],[5,-28],[17,-47],[3,-17],[-5,-21],[-24,-12],[-7,-16],[7,-46]],[[8437,3016],[31,-199],[15,-138],[-6,-105],[-39,-47],[-50,-65],[-21,-60],[8,-65],[61,-46],[32,-66],[11,-99],[0,-1]],[[8479,2125],[-218,-125],[-145,-17],[-12,7],[-23,24],[-125,61],[-97,-36],[-26,-24],[-70,-94],[-24,-17],[-12,-2],[-11,-6],[-12,-10],[-10,-16],[-69,-114]],[[8050,3098],[13,1],[10,-12],[37,-112],[36,-184],[57,-86],[79,40],[59,105],[96,166]],[[8364,3824],[-23,-66],[-11,-85],[-26,-73],[-60,-39],[-18,-73],[5,-105],[56,-125],[95,-92],[55,-150]],[[8944,3760],[41,7],[42,-19],[37,-34],[5,-113],[-2,-65],[4,-65],[-3,-67],[-7,-65],[-2,-93],[-7,-38],[-5,-44],[20,-119]],[[9067,3045],[-6,-90],[-32,-79],[-88,20],[-111,39],[-105,66],[-69,7],[-41,-99],[-104,20],[-74,87]],[[9257,3048],[-3,-145],[-11,-93],[9,-85],[17,-105],[-4,-139],[-13,-84],[-7,-34]],[[9245,2363],[-14,26],[-6,4],[-10,-4],[-5,-5],[-5,-12],[-4,-2],[-5,1],[-3,3],[-69,90],[-9,6],[-16,-3],[-21,-14],[-20,-21],[-13,-24],[-23,-19],[-21,8],[-43,35],[-4,8],[-3,27],[-4,9],[-6,1],[-5,-1],[-26,-25],[-3,-6],[-4,-13],[-1,-11],[0,-11],[-2,-12],[-66,-233],[-6,-43],[-2,-9],[-8,-9],[-45,-19],[-30,-24],[-24,-6],[0,45],[-1,22],[-4,10],[-6,20],[9,89],[-3,20],[-4,5],[-17,35],[-3,8],[-2,16],[-3,8],[-3,3],[-3,-7],[-4,-9],[-3,-3],[-15,18],[-8,3],[0,7],[1,16],[-1,18],[-6,18],[-9,-19],[-8,-11],[-26,-84],[-39,-90],[-23,-34],[-59,-34]],[[9067,3045],[42,54],[45,-14],[39,-40],[14,-7],[25,1],[25,9]],[[9685,3320],[-2,-12],[9,-35],[18,-7],[34,10],[7,-5],[18,-22],[6,-9],[3,-15],[2,-18],[3,-20],[6,-18],[4,-3],[3,3],[4,2],[4,-8],[0,-8],[-2,-25],[0,-10],[3,-18],[8,-2],[8,7],[7,10],[14,4],[15,-17],[13,-27],[19,-57],[1,-15],[-5,-20],[-18,-36],[-5,-14],[-2,-48],[11,-29],[11,-21],[2,-28],[-4,-32],[-4,-39],[-1,-39],[3,-33],[2,-27],[-7,-47],[3,-27],[7,-9],[20,-5],[8,-15],[7,-45],[5,-13],[19,7],[5,-15],[3,-22],[4,-22],[30,-47],[12,-33],[-1,-52],[-7,-19],[-7,-11],[-6,-13],[-4,-29],[2,-32],[5,-27],[3,-27],[-3,-31],[-7,28],[-10,13],[-55,19],[-10,-2],[-16,-19],[-21,-36],[-19,-43],[-12,-39],[-13,-25],[-14,-18],[-44,-36],[-4,-18],[-2,-25],[-8,-34],[-1,0],[-4,-27],[-5,-11],[-7,-2],[-21,14],[-5,9],[-4,17],[-21,116],[-3,33],[0,34],[4,32],[9,28],[7,9],[6,3],[5,6],[4,19],[1,15],[-1,20],[-2,35],[-5,36],[-6,28],[-8,21],[-12,19],[-51,51],[-9,4],[-18,7],[-24,-9],[-19,-40],[-15,-55],[-16,-44],[-28,-13],[-9,-23],[-7,-5],[-4,7],[-11,26],[-5,9],[-13,8],[-13,3],[-54,-9],[-12,4],[-14,13],[-9,18],[-4,5],[-7,3],[-7,-3],[-13,-12],[-6,-2],[-9,8],[-24,49],[-21,26],[-7,13]],[[9257,3048],[70,1],[70,27],[15,20],[15,14],[22,-8],[21,-21],[34,-1],[33,17],[29,43],[13,85],[22,90],[38,18],[45,-13],[1,0]],[[9602,5602],[3,-15],[3,-34],[6,-32],[0,-11],[-2,-11],[1,-14],[1,-14],[7,-31],[0,-14],[-4,-29],[1,-14],[14,-25],[23,-29],[20,-34],[4,-39],[-10,-48],[-3,-25],[5,-63],[-5,-19],[-8,-17],[-8,-29],[0,-1],[3,-11],[2,-10],[2,-25],[3,-11],[5,-9],[4,-10],[0,-14],[0,-14],[2,-12],[2,-12],[5,-36],[7,-24],[8,-19],[28,-32],[3,-46],[-15,-116],[-2,-32],[1,-20],[3,-19],[3,-28],[-3,-12],[-4,-11],[-2,-10],[7,-8],[9,-7],[4,-6],[4,-11],[4,-26],[0,-33],[-3,-63],[5,-81],[-1,-27],[-6,-65],[0,-18],[1,-41],[0,-14],[-2,-26],[2,-14],[5,-8],[7,-9],[26,-11],[18,24],[6,3],[8,-8],[8,-15],[6,-21],[4,-25],[0,-26],[-11,-40],[-19,-36],[-15,-40],[2,-76],[-2,-31],[-3,-31],[-3,-24],[-4,-12],[-9,-10],[-5,-9],[0,-14],[4,-29],[-3,-10],[-10,-12],[-7,-13],[-5,-21],[-4,-33],[-5,-24],[-12,-35],[-5,-23],[-5,-20],[-3,-20],[-1,-20],[3,-22],[0,-21],[-4,-17],[-6,-16],[0,-6]],[[8768,8936],[7,1],[11,16],[15,55],[12,27],[5,26],[5,65],[5,26],[11,19],[3,2],[10,8],[26,5],[73,-14],[10,-11],[-4,-15],[-2,-16],[-1,-16],[-2,-14],[-4,-12],[-10,-20],[-5,-16],[14,-18],[10,-25],[9,-7],[13,34],[7,10],[4,-11],[3,-19],[4,-18],[4,-6],[16,-12],[3,-7],[2,-7],[2,-6],[5,-4],[4,-11],[16,-67],[7,-19],[39,-61],[25,-50],[16,-18],[15,-5],[1,-8],[-7,-23],[-8,-15],[-28,-34],[14,-10],[12,3],[10,-3],[11,-27],[12,-71],[8,-13],[48,31],[15,3],[16,-11],[15,-19],[14,-30],[7,-38],[-6,-41]],[[9403,6832],[24,-31],[47,-32],[58,-73],[62,-25],[9,6],[18,30],[11,7],[5,-3],[7,-15],[4,-4],[6,2],[10,7],[15,5],[32,20],[17,0],[20,-14],[28,-40],[44,-59],[30,-62],[14,-35],[6,-23],[2,-25],[2,-13],[4,-11],[8,-14],[2,-15],[0,-18],[2,-9],[7,10],[19,-52],[9,-13],[3,-1],[6,2],[2,-1],[3,-6],[3,-12],[32,-99],[8,-32],[5,-20],[6,-61],[6,-20],[-42,73],[-11,20],[-31,34],[-7,19],[-14,51],[-8,13],[-13,-9],[-56,-107],[-2,-18],[3,-52],[-1,-19]],[[6194,1360],[-40,-63],[-21,0],[-85,39],[-12,-3],[-33,-21],[-10,4],[-8,6],[-9,2],[-10,-11],[-8,-20],[-4,-15],[-5,-4],[-10,14],[-10,22],[-2,18],[4,51],[0,33],[-4,21],[-16,36],[-8,18],[-10,15],[-10,10],[-10,5],[-33,5],[-96,82]],[[1733,7397],[-6,-5],[-28,15],[-46,67],[-28,15],[10,49],[17,27],[37,34],[9,12],[7,12],[22,52],[9,9],[154,33],[22,17],[21,28],[11,20],[3,2],[4,-8],[5,-15],[5,-11],[6,7]],[[2764,8380],[71,5],[13,17],[5,4],[6,-1],[11,-8],[6,-1],[21,10],[4,-2],[5,-7],[2,-1],[4,2],[1,7],[1,7],[3,6],[22,19],[17,25],[12,27]],[[3460,8776],[57,-6],[55,32],[63,122],[23,116],[30,19],[49,108]],[[3380,9204],[14,20],[9,39],[34,90],[2,8],[8,35],[18,12],[29,3],[0,10],[5,3],[5,8],[1,11],[2,7],[3,3],[2,-3],[5,-16],[2,-2],[9,10],[11,29],[8,16],[36,43],[6,10],[7,8],[8,2],[8,-9],[6,25],[12,20],[14,7],[12,-14],[9,2],[31,27],[8,9],[8,-1],[15,2]]],"transform":{"scale":[0.0019145648082808343,0.0006279631061106058],"translate":[25.66325931100002,35.81977854500008]}};
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

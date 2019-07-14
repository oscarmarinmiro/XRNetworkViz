import * as d3 from "d3"

AFRAME.registerComponent('net-viz-texture', {

      schema: {
          data: {type: 'string', default: ""},
          radius: {type: 'number', default: 10},
          initial_min_degree: {type: 'number', default: 50},
          size_attribute: {type: 'string', default: "Degree"},
          node_size_range: {type: 'array', default: [0.01, 0.25]},
          node_color_range: {type: 'array', default: ["#F00", "#FFF", "#00F"]},
          num_points: {type: 'int', default: 10},

      },
      // Make some data transforms to ease up later real-time data processing on the network

      prepare_data: function(){

          console.log("PREPARING DATA");

          this.filters = {'values': {degree:[], size: []}, 'domains': {degree: [], size: []}};

          if(this.net_data){

              let max_min = {x: [], y: []};

              // Prepare node dictionary, also filter domains

              this.net_data.nodes.map(node => {
                  this.node_dict[node.id] = node;

                  max_min.x.push(node.x);
                  max_min.y.push(node.y);

                  this.filters.domains.degree.push(+node.attributes.Degree);
                  this.filters.domains.size.push(+node.attributes[this.data.size_attribute]);

              });

              // Insert degree domains + degree values

              this.filters.domains.degree = d3.extent(this.filters.domains.degree);
              this.filters.domains.size = d3.extent(this.filters.domains.size);

              this.filters.values.degree = [this.data.initial_min_degree, this.filters.domains.degree[1]];


              // Set global extents

              this.extents = {x: d3.extent(max_min.x), y: d3.extent(max_min.y)};

              // Substitute edge source and target with real data

              this.net_data.edges.map(edge => {

                  edge.source = (edge.source in this.node_dict) ? this.node_dict[edge.source] : null;

                  edge.target = (edge.target in this.node_dict) ? this.node_dict[edge.target] : null;

              });

          }

          console.log("PREPARED DATA", this.node_dict, this.net_data, Object.keys(this.node_dict).length, this.filters);

          // Object.entries(this.node_dict).map(([a,b]) => console.log(a,b));
      },

     // spherical to cartesian

     convert: function(lat, long, radius){

              var cosPhi = Math.cos(lat/180 * Math.PI);

              return {
                  x: radius * cosPhi * Math.cos(long/180 * Math.PI),
                  y: radius * Math.sin(lat/180 * Math.PI),
                  z: radius * cosPhi * Math.sin(long/180 * Math.PI),
              }

      },

      // Filter node by conditions selected on UI

      filter_node: function(node){

          // Degree condition

          if((+node.attributes.Degree >= this.filters.values.degree[0]) && (+node.attributes.Degree <= this.filters.values.degree[1])){
              return true;
          }
          else {
              return false;
          }

      },

      render_edges: function(){

          let lat_scale = d3.scaleLinear(this.extents.x,[-90, 90]);
          let long_scale = d3.scaleLinear(this.extents.y,[-180, 180]);

          let width_scale = d3.scaleLinear([this.filters.values.degree[0], this.filters.values.degree[1]], [0.1, 0.1]);

          let opacity_scale = d3.scaleLinear([this.filters.values.degree[0], this.filters.values.degree[1]], [0, 1]);

          this.rendered_edges = 0;

          this.net_data.edges.map(edge => {

              // If both source and target are filtered in: draw the edge

              if((edge.source.id in this.filtered_nodes) && (edge.target.id in this.filtered_nodes)){

                  // Average degree for line width calculation

                  let average_degree = (+edge.source.attributes.Degree + +edge.target.attributes.Degree)/2;

                  // if(average_degree > 50) {

                      let init_lat = lat_scale(edge.source.y);
                      let init_long = long_scale(edge.source.x);

                      let end_lat = lat_scale(edge.target.y);
                      let end_long = long_scale(edge.target.x);

                      let lat_points_scale = d3.scaleLinear([0, this.data.num_points - 1], [init_lat, end_lat]);
                      let long_points_scale = d3.scaleLinear([0, this.data.num_points - 1], [init_long, end_long]);

                      let path_points = [];

                      for (let i = 0; i < this.data.num_points; i++) {

                          path_points.push(this.convert(lat_points_scale(i), long_points_scale(i), this.data.radius));
                      }

                      let line = document.createElement("a-entity");

                      line.setAttribute("meshline", {
                          lineWidth: 0.01,
                          opacity: 0.75,
                          color: edge.color,
                          transparent: true,
                          path: path_points.map(AFRAME.utils.coordinates.stringify).join(",")
                      });

                      this.el.appendChild(line);

                      this.rendered_edges++;
                  // }

              }

          });
      },

      render_nodes: function(){

          let lat_scale = d3.scaleLinear(this.extents.x,[-90, 90]);
          let long_scale = d3.scaleLinear(this.extents.y,[-180, 180]);
          let radius_scale = d3.scaleSqrt(this.filters.domains.size, this.data.node_size_range);
          let color_scale = d3.scaleLinear([0,0.5,1], this.data.node_color_range);
          let categorical_color = d3.scaleOrdinal(d3.schemePaired);

          // Reset filtered node list

          this.filtered_nodes = {};

          // Render nodes one by one

          Object.values(this.node_dict).map(node => {

              if(this.filter_node(node)){

                  // Render node

                  let node_position = this.convert(lat_scale(node.y), long_scale(node.x), this.data.radius);

                  let my_node = document.createElement("a-sphere");

                  my_node.setAttribute("position", node_position);
                  my_node.setAttribute("color", node.color);
                  my_node.setAttribute("radius", radius_scale(+node.attributes[this.data.size_attribute]));
                  my_node.setAttribute("material", {shader: "flat", opacity: 0.7});

                  this.el.appendChild(my_node);

                  this.filtered_nodes[node.id] = true;

              }

          });






      },

      init: function () {

          console.log("INIT: ");
          console.log("INIT: LOADING FILE");

          // This object will hold nodes keyed by id

          this.node_dict = {};

          // This one, nodes finally rendered

          this.filtered_nodes = {};

          // Load new data

         d3.json(this.data.data).then(net_data => {

            // Set cursor and controllers based on HMD connected (desktop, cardboard, vive, oculus + oculus go)

            //AFRAME.UIPACK.utils.set_cursor(self.el.sceneEl, 'light');

            console.log("LOADED DATA PAPOLLA", net_data);

            this.net_data = net_data;

            this.prepare_data();

            this.update();

        })
        .catch(error => {
            console.log("ERROR GETTING TREE DATA", error, this.data.data);
        });


      },

      update: function (oldData) {

        console.log("UPDATE:", this.data, d3);

        if(Object.keys(this.node_dict).length === 0){
            console.log("UPDATE: No cooked data");
        }
        else {
            console.log("UPDATE: Have cooked data");

            this.render_nodes();

            console.log("NUMBER OF RENDERED NODES ", Object.keys(this.filtered_nodes).length);

            this.render_edges();

            console.log("NUMBER OF RENDERED EDGES ", this.rendered_edges);

        }

      },

      remove: function () { },

      tick: function (t) { },

      pause: function () { },

      play: function () { }

});


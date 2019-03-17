import * as d3 from "d3"

AFRAME.registerComponent('net-viz', {

      schema: {
          data: {type: 'string', default: ""},
          radius: {type: 'number', default: 10},
          max_depth: {type: 'number', default: 2},
          bottom_radius: {type: 'number', default: 1},
          num_points: {type: 'int', default: 100},
          transition: {type: 'int', default: 1000},
          text_color: {type: 'string', default: "white"},
          branch_color: {type: 'string', default: "#345678"},
          frame_text_color: {type: 'string', default:"black"},
          frame_background_color: {type: 'string', default:"white"},

      },

      init: function () {

      },

      update: function (oldData) {

        console.log("UPDATING NETVIZ", this.data, d3);
          // Load new data

        // d3.json(self.data.data).then(tree_data => {
        //
        //     // Set cursor and controllers based on HMD connected (desktop, cardboard, vive, oculus + oculus go)
        //
        //     AFRAME.UIPACK.utils.set_cursor(self.el.sceneEl, 'light');
        //
        // })
        // .catch(error => {
        //     console.log("ERROR GETTING TREE DATA", error, self.data.data);
        // });

      },

      remove: function () { },

      tick: function (t) { },

      pause: function () { },

      play: function () { }

});


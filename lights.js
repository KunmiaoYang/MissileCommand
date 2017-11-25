var LIGHTS = function () {
    return {
        ready: false,
        array: [],
        load: function () {
            this.ready = false;
            $.getJSON(URL.lights, function (data) {
                LIGHTS.array = data;
                LIGHTS.ready = true;
                $('canvas').trigger('loadData');
            });
        }
    }
}();
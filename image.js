var IMAGE = function () {
    function createImage(url) {
        var image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        return image;
    }
    return {
        img: {
            terrain: createImage(URL.img.terrain),
            background: createImage(URL.img.background),
            explosion: createImage(URL.img.explosion)
        },
        create: createImage
    }
}();
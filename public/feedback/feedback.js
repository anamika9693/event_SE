$(document).ready(function () {

    (function changeBg() {
        var img_array = ["http://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Still_nature_-_Museu_Calouste_Gulbenkian.JPG/1280px-Still_nature_-_Museu_Calouste_Gulbenkian.JPG",
            "http://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Snow_covered_hillside_with_small_evergreens.jpg/1280px-Snow_covered_hillside_with_small_evergreens.jpg",
            "http://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Uvas.jpg/1280px-Uvas.jpg"
        ],
            _nxtIndex = 0,
            _curIndex = 0,
            interval = 15000;
        function nextIndex() { _nxtIndex = (_nxtIndex + 1) % img_array.length; return _nxtIndex; };

        function shiftIndexes() {
            _curIndex = _nxtIndex;
            nextIndex();
        }

        function assignBackgrounds() {
            for (var i = 0; i < img_array.length; i++) {

                $('#background-slide' + i).css('backgroundImage', function () {
                    return 'url(' + img_array[i] + ')';
                });
                if (i == 0) {
                    $('#background-slide' + i).css('opacity', 1);
                }
                else {
                    $('#background-slide' + i).css('opacity', 0);
                }
            }
        }

        function startBackgroundOpacityToggle() {
            //console.log("in startBackgroundOpacityToggle. _curIndex = "+_curIndex);
            elem = $('#background-slide' + _curIndex);
            elem.animate({
                opacity: (elem.css('opacity') == 0) ? 1 : 0
            }, {
                duration: 5000,
                start: finishBackgroundOpacityToggle
            });
        };

        function finishBackgroundOpacityToggle() {
            //console.log("in finishBackgroundOpacity. _nxtIndex = "+_nxtIndex);
            elem = $('#background-slide' + _nxtIndex);
            elem.animate({
                opacity: (elem.css('opacity') == 0) ? 1 : 0
            }, {
                duration: 5000,
                complete: runSlider
            });

        };

        function runSlider() {
            shiftIndexes();
            setTimeout(startBackgroundOpacityToggle, interval);
        }

        assignBackgrounds();
        runSlider();
    })();
});

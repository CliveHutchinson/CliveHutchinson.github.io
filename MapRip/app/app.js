window.onload = () => {
    document.getElementById("mapNumInput").addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("getMapBtn").click();
        }
    });
};
var iiifRip;
(function (iiifRip) {
    let manifestCache;
    function onGetMapClick() {
        const mapNum = document.getElementById("mapNumInput").value;
        if (mapNum.length < 5) {
            setMapNumErrorMsg("Map number must be at least 5 digits long;");
            return;
        }
        setMapNumErrorMsg("");
        const url = `https://mapview.nls.uk/iiif/${mapNum.substr(0, mapNum.length - 4)}%2F${mapNum}`;
        getManifest(url)
            .then(getMapMinZoom)
            .catch(() => setMapNumErrorMsg(`Could not find the map ${mapNum.toString()}`));
    }
    iiifRip.onGetMapClick = onGetMapClick;
    function onMapScaleChange() {
        getImage(manifestCache, parseInt(document.getElementById("mapScaleSelect").value));
    }
    iiifRip.onMapScaleChange = onMapScaleChange;
    function onChangeMapClick() {
        document.getElementById("mapNumInput").value = "";
        const mapScaleSelectElem = document.getElementById("mapScaleSelect");
        for (let i = mapScaleSelectElem.options.length - 1; i >= 0; i--) {
            mapScaleSelectElem.options[i] = null;
        }
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("mapNumDiv").hidden = false;
        document.getElementById("mapScaleDiv").hidden = true;
    }
    iiifRip.onChangeMapClick = onChangeMapClick;
    function getMapMinZoom(manifest) {
        manifestCache = manifest;
        const scaleFactors = manifest.tiles[0].scaleFactors;
        const minScale = scaleFactors.reduce((acc, x) => Math.max(acc, x));
        getImage(manifest, minScale);
        const mapScaleSelectElem = document.getElementById("mapScaleSelect");
        scaleFactors.forEach(scaleFactor => {
            const optionElem = document.createElement("option");
            optionElem.value = scaleFactor.toString();
            optionElem.text = `1:${scaleFactor}`;
            mapScaleSelectElem.append(optionElem);
        });
        mapScaleSelectElem.selectedIndex = mapScaleSelectElem.length - 1;
        document.getElementById("mapNumDiv").hidden = true;
        document.getElementById("mapScaleDiv").hidden = false;
    }
    function setMapNumErrorMsg(msg) {
        document.getElementById("mapNumErrorSpan").innerHTML = msg;
    }
    function getManifest(url) {
        var xhr = new XMLHttpRequest();
        return new Promise(function (resolve, reject) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 300) {
                        reject("Error, status code = " + xhr.status);
                    }
                    else {
                        resolve(JSON.parse(xhr.responseText));
                    }
                }
            };
            xhr.open('get', `${url}/info.json`, true);
            xhr.send();
        });
    }
    function getImage(manifest, scale) {
        const url = manifest["@id"];
        const imgWidth = manifest.width;
        const imgHeight = manifest.height;
        const tileWidth = manifest.tiles[0].width;
        const tileHeight = manifest.tiles[0].height;
        const imgSectionWidth = tileWidth * scale;
        const imgSectionHeight = tileHeight * scale;
        const canvas = document.getElementById('canvas');
        canvas.width = Math.round(imgWidth / scale + 0.5);
        canvas.height = Math.round(imgHeight / scale + 0.5);
        const ctx = canvas.getContext('2d');
        for (let x = 0; x <= imgWidth; x += imgSectionWidth) {
            for (let y = 0; y <= imgHeight; y += imgSectionHeight) {
                let thisSectionWidth = imgSectionWidth;
                let thisTileWidth = tileWidth;
                if (imgWidth - x < imgSectionWidth) {
                    thisSectionWidth = imgWidth - x;
                    thisTileWidth = Math.round(thisSectionWidth / scale + 0.5);
                }
                let thisSectionHeight = imgSectionHeight;
                let thisTileHeight = tileHeight;
                if (imgHeight - y < imgSectionHeight) {
                    thisSectionHeight = imgHeight - y;
                    thisTileHeight = Math.round(thisSectionHeight / scale + 0.5);
                }
                const drawTileToCanvas = (tile) => ctx.drawImage(tile, x / scale, y / scale);
                getTile(`${url}/${x},${y},${thisSectionWidth},${thisSectionHeight}/${thisTileWidth},${thisTileHeight}/0/default.jpg`)
                    .then(drawTileToCanvas);
            }
        }
    }
    function getTile(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
})(iiifRip || (iiifRip = {}));
//# sourceMappingURL=app.js.map
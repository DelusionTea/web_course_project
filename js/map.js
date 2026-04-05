(function () {
  "use strict";

  function showFallback(mapEl, message) {
    if (!mapEl) return;
    mapEl.innerHTML =
      '<p style="padding:2rem;text-align:center;line-height:1.6;color:#2c2c2c">' +
      (message ||
        "Карта не загрузилась. Подключите API-ключ Яндекс.Карт в URL скрипта: api-maps.yandex.ru/2.1/?apikey=ВАШ_КЛЮЧ&amp;lang=ru_RU") +
      "</p>";
  }

  function initWhenReady() {
    var mapEl = document.getElementById("map");
    if (!mapEl) return;

    if (typeof ymaps === "undefined") {
      showFallback(mapEl);
      return;
    }

    ymaps.ready(function () {
      try {
        var center = [55.760837, 37.618423];
        var map = new ymaps.Map(
          "map",
          {
            center: center,
            zoom: 16,
            controls: ["zoomControl", "fullscreenControl"],
          },
          { suppressMapOpenBlock: true }
        );

        var placemark = new ymaps.Placemark(
          center,
          {
            balloonContent: "МХАТ имени Чехова",
            hintContent: "МХАТ имени Чехова",
          },
          { preset: "islands#redIcon" }
        );

        map.geoObjects.add(placemark);
      } catch (e) {
        console.error(e);
        showFallback(mapEl, "Ошибка инициализации карты.");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenReady);
  } else {
    initWhenReady();
  }
})();

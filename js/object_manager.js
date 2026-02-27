var myMap;
var placemarkCollections = {};
var placemarkList = {};

// Список городов и магазинов в них
var shopList = [
    {
        cityName: "Камышин",
        shops: [
            {
                coordinates: [50.10007069457058, 45.40316283702851],
                name: "г.Камышин, 2-й железнодорожный переезд, корпус 1",
                timework:
                    "пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30",
                how: "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>",
                phone: "+78445790099",
            },
            {
                coordinates: [50.105875308002666, 45.4138970375061],
                name: "г.Камышин, ул.Ленина, 14А",
                timework:
                    "пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30",
                how: "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>",
                phone: "+78445791119",
            },
            {
                coordinates: [50.08035315572386, 45.407588481903076],
                name: "г.Камышин, ул.Спартаковская, 75",
                timework:
                    "пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30",
                how: "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>",
                phone: "+78445790099",
            },
            {
                coordinates: [50.135726811041174, 45.20690023899079],
                name: "г.Петров-Вал, ул.Ленина, 29",
                timework:
                    "пн-пт: 8:00 - 18:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30",
                how: "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>",
                phone: "+78445790099",
            },
        ],
    },
];

ymaps.ready(init);

function init() {
    // Создаем карту
    myMap = new ymaps.Map("map", {
        center: [50.108462, 45.307467],
        zoom: 11,
        controls: ["zoomControl"],
    });

    for (var i = 0; i < shopList.length; i++) {
        // Создаём коллекцию меток для города
        var cityCollection = new ymaps.GeoObjectCollection();

        for (var c = 0; c < shopList[i].shops.length; c++) {
            var shopInfo = shopList[i].shops[c];

            // Извлекаем URL маршрута из HTML
            var routeUrl = "#";
            var match = shopInfo.how.match(/href=['"]([^'"]+)['"]/);
            if (match) {
                routeUrl = match[1];
            }

            // Сохраняем данные магазина для карточки
            var shopData = {
                address: shopInfo.name,
                time:
                    shopInfo.timework ||
                    "пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30",
                route: routeUrl,
            };

            var shopPlacemark = new ymaps.Placemark(
                shopInfo.coordinates,
                {
                    hintContent: shopInfo.name,
                    shopData: shopData, // Сохраняем данные в свойствах метки
                    balloonContent: "", // Отключаем стандартный балун
                },
                {
                    preset: "islands#redDotIcon",
                },
            );

            // Добавляем обработчик клика на метку
            shopPlacemark.events.add("click", function (e) {
                e.preventDefault(); // Отменяем стандартное поведение
                var target = e.get("target");
                var shopData = target.properties.get("shopData");
                openFullscreenCard(shopData);
            });

            if (!placemarkList[i]) placemarkList[i] = {};
            placemarkList[i][c] = shopPlacemark;

            // Добавляем метку в коллекцию
            cityCollection.add(shopPlacemark);
        }

        placemarkCollections[i] = cityCollection;

        // Добавляем коллекцию на карту
        myMap.geoObjects.add(cityCollection);

        // Обновляем список магазинов
        $("#shops").html("");
        for (var c = 0; c < shopList[0].shops.length; c++) {
            var shopInfo = shopList[0].shops[c];
            var routeUrl = "#";
            var match = shopInfo.how.match(/href=['"]([^'"]+)['"]/);
            if (match) {
                routeUrl = match[1];
            }

            $("#shops").append(`
                <div style="background-color: transparent; padding: 10px 20px; margin-bottom: 15px;">
                    <li style="list-style-type: none; cursor: pointer;" value="${c}" class="shop-list-item">
                        <b style="color: #FF5733; font-size: 9px;">
                            <h1>${shopInfo.name}</h1>
                        </b>
                        <div style="margin-bottom: 10px;">
                            <p style="color: black; letter-spacing: 1px; padding: 10px 0">
                                ${shopInfo.timework || "пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30"}
                            </p>
                            <p style="color: yellow;">
                                ${shopInfo.how}
                            </p>
                        </div>
                    </li>
                </div>
            `);
        }
    }
}

// Функция открытия полноэкранной карточки
function openFullscreenCard(shopData) {
    // Создаем элемент для карточки, если его нет
    let modal = document.getElementById("shop-fullscreen-modal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "shop-fullscreen-modal";
        document.body.appendChild(modal);
    }

    // Формируем HTML карточки
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeFullscreenCard()">
            <div class="modal-card" onclick="event.stopPropagation()">
                <button class="modal-close-btn" onclick="closeFullscreenCard()">×</button>
                
                <div class="modal-card-content">
                    <div class="modal-address">
                        <h2>${shopData.address || "Адрес не указан"}</h2>
                    </div>
                    
                    <div class="modal-schedule">
                        ${shopData.time || "Режим работы не указан"}
                    </div>
                    
                    <a href="${shopData.route}" target="_blank" class="modal-route-btn">
                         Как добраться?
                    </a>
                    
                     
                </div>
            </div>
        </div>
    `;

    // Показываем карточку с анимацией
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);

    // Блокируем скролл body
    document.body.style.overflow = "hidden";
}

// Функция закрытия карточки
window.closeFullscreenCard = function () {
    const modal = document.getElementById("shop-fullscreen-modal");
    if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "";

        // Удаляем карточку после анимации
        setTimeout(() => {
            if (modal && !modal.classList.contains("show")) {
                modal.innerHTML = "";
            }
        }, 300);
    }
};

// Закрытие по клавише ESC
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeFullscreenCard();
    }
});

// Обработчик клика на адрес в списке
$(document).on("click", "#shops li", function () {
    var shopId = $(this).val();
    var shopInfo = shopList[0].shops[shopId];

    // Извлекаем URL маршрута
    var routeUrl = "#";
    var match = shopInfo.how.match(/href=['"]([^'"]+)['"]/);
    if (match) {
        routeUrl = match[1];
    }

    var shopData = {
        address: shopInfo.name,
        time:
            shopInfo.timework ||
            "пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30",
        route: routeUrl,
        // phone: shopInfo.phone || '+78445790099'
    };
    openFullscreenCard(shopData);
});

// Добавляем CSS стили автоматически
function addModalStyles() {
    const style = document.createElement("style");
    style.textContent = `
        /* Модальное окно */
        #shop-fullscreen-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        #shop-fullscreen-modal.show {
            display: block;
            opacity: 1;
        }

        /* Затемненный фон */
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        }

        /* Карточка */
        .modal-card {
            background: white;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 28px;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: scale(0.9) translateY(20px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        #shop-fullscreen-modal.show .modal-card {
            transform: scale(1) translateY(0);
        }

        /* Кнопка закрытия */
       .modal-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border: none;
    background: #f1f5f9;
    border-radius: 50%;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.2s;
    z-index: 20; /* Увеличиваем z-index */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.5);
}

.modal-close-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
    transform: rotate(90deg);
}

        /* Контент карточки */
        .modal-card-content {
            padding: 60px 32px 32px;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Адрес */
        .modal-address h2 {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 24px 0;
            line-height: 1.3;
            border-left: 6px solid #FF5733;
            padding-left: 20px;
            word-break: break-word;
        }

        /* Расписание */
        .modal-schedule {
            background: #f8fafc;
            border-radius: 20px;
            padding: 24px;
            margin: 24px 0;
            font-size: 18px;
            line-height: 1.8;
            color: #334155;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Кнопка маршрута */
        .modal-route-btn {
            display: block;
            background: linear-gradient(135deg, #FF5733, #ff3407);
            color: white !important;
            text-decoration: none;
            padding: 16px 24px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 18px;
            text-align: center;
            transition: all 0.3s;
            
            margin: 16px 0;
            border: none;
            cursor: pointer;
        }

        .modal-route-btn:hover {
            
            transform: translateY(-2px);
           
        }


        /* Мобильная версия */
        @media (max-width: 600px) {
            .modal-card {
                max-width: 100%;
                border-radius: 24px 24px 0 0;
                max-height: 85vh;
            }
            
            .modal-overlay {
                align-items: flex-end;
                padding: 0;
            }
            
            .modal-card-content {
                padding: 32px 24px 24px;
            }
            
            .modal-address h2 {
                font-size: 22px;
                padding-left: 16px;
            }
            
            .modal-schedule {
                padding: 20px;
                font-size: 16px;
            }
            
            .modal-route-btn,
            .modal-phone-btn {
                padding: 14px 20px;
                font-size: 16px;
            }
        }

        /* Стили для скролла */
        .modal-card::-webkit-scrollbar {
            width: 6px;
        }

        .modal-card::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .modal-card::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }

        .modal-card::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        
        /* Стили для элементов списка */
        .shop-list-item {
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .shop-list-item:hover {
            transform: translateX(5px);
        }
    `;
    document.head.appendChild(style);
}

// Добавляем стили при загрузке страницы
addModalStyles();

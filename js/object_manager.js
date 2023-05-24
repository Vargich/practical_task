// ymaps.ready(init);

// function init () {
//     var myMap = new ymaps.Map("map", {
//             center: [50.169861746007314, 45.00823974609376], 
//             zoom: 10
//         }, {
//             searchControlProvider: 'yandex#search'
//         }),
//         objectManager = new ymaps.ObjectManager({
//             // Чтобы метки начали кластеризоваться, выставляем опцию.
//             clusterize: true,
//             // ObjectManager принимает те же опции, что и кластеризатор.
//             gridSize: 32,
//             clusterDisableClickZoom: true
//         });

//     // Чтобы задать опции одиночным объектам и кластерам,
//     // обратимся к дочерним коллекциям ObjectManager.
//     objectManager.objects.options.set('preset', 'islands#greenDotIcon');
//     objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');
//     myMap.geoObjects.add(objectManager);

//     $.ajax({
//         url: "data.json"
//     }).done(function(data) {
//         objectManager.add(data);
//     });

// }
var myMap;
var placemarkCollections = {};
var placemarkList = {};
 
// Список городов и магазинов в них
var shopList = [
    {
        'cityName': 'Камышин',
        'shops': [
            {'coordinates': [50.10007069457058, 45.40316283702851], 'name': 'г.Камышин, 2-й железнодорожный переезд, корпус 1', 'timework': 'пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30', 'how': "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>"},
            {'coordinates': [50.105875308002666, 45.4138970375061], 'name': 'г.Камышин, ул.Ленина, 14А', 'timework': 'пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30', 'how': "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>"},
            {'coordinates': [50.08035315572386, 45.407588481903076], 'name': 'г.Камышин, ул.Спартаковская, 75',  'timework': 'пн-пт: 8:00 - 17:00<br>сб: 8:30 - 15:00<br>вс: 8:30 - 14:00<br>ПЕРЕРЫВ: 12:00 - 12:30', 'how': "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>"},
            {'coordinates': [50.135726811041174, 45.20690023899079], 'name': 'г.Петров-Вал, ул.Ленина, 29', 'how': "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>"},
            {'coordinates': [50.31529804192351, 44.80890870094299], 'name': 'г.Котово, ул.Разина, 6', 'how': "<font size=4><b><a target='_blank' href='https://yandex.ru/maps/10959/kamishin/?ll=45.406037%2C50.097563&mode=routes&rtext=~50.100138%2C45.403078&rtt=auto&ruri=~&z=16.15'>Как добраться?</a></b></font>"}

        ]
    }
];
 
ymaps.ready(init);
 
function init() {
 
    // Создаем карту
    myMap = new ymaps.Map("map", {
        center: [50.169861746007314, 45.00823974609376], 
        zoom: 10,
        
        controls: [
            'zoomControl'
        ],
        
    });

 
    for (var i = 0; i < 2; i++) {
 
        // Добавляем название города в выпадающий список
 
        // Создаём коллекцию меток для города
        var cityCollection = new ymaps.GeoObjectCollection();
        let i = 0;
        for (var c = 0; c < shopList[i].shops.length; c++) {
            var shopInfo = shopList[i].shops[c];
 
            var shopPlacemark = new ymaps.Placemark(
                shopInfo.coordinates,
                {
                    hintContent: shopInfo.name,
                    //balloonContent:  +'<br>'+ shopInfo.timework,
                    balloonContent: [
                        '<div class="map__balloon">'+
                        '<div class="store-info-address">'+
                       '<b>'+shopInfo.name+'</b>'+
                       '</div>'+
                       '<div class="store-info-time">'+
                        shopInfo.timework+
                       '</div>'+
                       '<div class="store-info-way">'+
                        shopInfo.how+
                       '</div>'+
                        '</div>'
                    ]
                },
                {
                    'preset': 'islands#redDotIcon'
                }
                
            );
 
            if (!placemarkList[i]) placemarkList[i] = {};
            placemarkList[i][c] = shopPlacemark;
 
            // Добавляем метку в коллекцию
            cityCollection.add(shopPlacemark);
 
        }
 
        placemarkCollections[i] = cityCollection;
 
        // Добавляем коллекцию на карту
        myMap.geoObjects.add(cityCollection);
        $('#shops').html('');
        for (var c = 0; c < shopList[0].shops.length; c++) {
            //$('#shops').append('<li value="' + c + '">' + shopList[0].shops[c].name + '</li>' + shopList[0].shops[c].balloonContentHeader+'<br>'+'</br>');
            $('#shops').append('<div style="background-color: #1a1a1a; padding: 10px 20px; margin-bottom: 15px;">'+'<li style="list-style-type: none;" value="' + c + '">' + '<b style="Color: #FF5733; font-size: 9px;">'+'<h1>'+shopList[0].shops[c].name+'</h1>' +'</b>' +'<div style="margin-bottom: 10px;">'+'<p style="color: white; letter-spacing: 1px; padding: 10px 0">'+ shopList[0].shops[c].timework+'</p>'+'<p style="color: yellow;">'+shopList[0].shops[c].how+'</>'+'</div>'+'</li>'+'</div>');

        }
    }
 
    $('select#cities').trigger('change');
}
 
 
// Клик на адрес
$(document).on('click', '#shops li', function () {
    var shopId = $(this).val();
   // myMap.setZoom( myMap.getZoom() + 1 );
    placemarkList[0][shopId].events.fire('click');
});

class excavateTerrain {
    constructor(viewer, config) {
        this.viewer = viewer;
        this.config = config;
        this.analysis();
    }
    /**
     * @description 开始地形挖掘分析
     */
    analysis() {
        var viewer = this.viewer;
        var config = this.config;
        var ellipsoid = viewer.scene.globe.ellipsoid;
        var arr = config.positions;
        var nArr = [];
        var nArr2 = [];
        arr.forEach((element) => {
            var catographic = Cesium.Cartographic.fromCartesian(element);
            //获取当前点位的高程
            var height = Number(catographic.height.toFixed(2));
            //笛卡尔坐标系转弧度
            var cartographic = ellipsoid.cartesianToCartographic({
                x: element.x,
                y: element.y,
                z: element.z,
            });
            //获取当前点位经纬度
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            var lng = Cesium.Math.toDegrees(cartographic.longitude);
            let tempObj = {
                x: lng,
                y: lat,
                z: height,
            };
            nArr.push(tempObj);
            nArr2.push(tempObj);
        });
        //获取传入坐标的第一个点
        var catographic = Cesium.Cartographic.fromCartesian(arr[0]);
        var height1 = Number(catographic.height.toFixed(2));
        var lat = Cesium.Math.toDegrees(catographic.latitude);
        var lng = Cesium.Math.toDegrees(catographic.longitude);
        nArr2.push({
            x: lng,
            y: lat,
            z: height1,
        });
        this.excavate(nArr, nArr2)
    }

    excavate(arr, nArr2) {
        var viewer = this.viewer;
        var config = this.config;
        var _this = this;
        //存储经纬度坐标
        var nar = [];
        //存储高度数据
        var hhh = [];
        var flag = _this.isClockWise(arr);
        if (flag === true) {
            arr.reverse();
            nArr2.reverse();
        }
        arr.forEach((element) => {
            nar.push(element.x);
            nar.push(element.y);
            hhh.push(element.z);
        });
        var points = [];
        arr.forEach((element) => {
            points.push(Cesium.Cartesian3.fromDegrees(element.x, element.y));
        });
        var pointsLength = points.length;
        var clippingPlanes = [];
        //获取裁剪平面集合
        for (var i = 0; i < pointsLength; ++i) {
            var nextIndex = (i + 1) % pointsLength;
            //将两个点的向量相加，存入一个新的对象中
            var midpoint = Cesium.Cartesian3.add(
                points[i],
                points[nextIndex],
                new Cesium.Cartesian3()
            );
            //将上面的向量除以2，得到中点坐标
            midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);
            //将中点向量单位化
            var up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
            //获取中点和下一个带你的方向向量
            var right = Cesium.Cartesian3.subtract(
                points[nextIndex],
                midpoint,
                new Cesium.Cartesian3()
            );
            //方向向量单位化
            right = Cesium.Cartesian3.normalize(right, right);
            //获取right和up的叉积
            var normal = Cesium.Cartesian3.cross(
                right,
                up,
                new Cesium.Cartesian3()
            );
            normal = Cesium.Cartesian3.normalize(normal, normal);
            
            var originCenteredPlane = new Cesium.Plane(normal, 0.0);
            var distance = Cesium.Plane.getPointDistance(
                originCenteredPlane,
                midpoint
            );
            clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
        };
        //获取裁剪面的
        viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
            planes: clippingPlanes,
            edgeWidth: 1.0,
            edgeColor: Cesium.Color.OLIVE,
        });
        this.removeEntity();
        //高程按照从小到大排序
        hhh.sort((a,b)=>a-b);
        //添加地面的贴图
        viewer.entities.add({
            id: "entityDM",
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(nar),
                material: new Cesium.ImageMaterialProperty({
                    image: config.bottom,
                    color: new Cesium.Color.fromCssColorString("#cbc6c2"),
                    repeat: new Cesium.Cartesian2(30, 30),
                }),
                height: hhh[0] - config.height,
            },
        });

        var maximumHeightsARR = [];
        var minimumHeights = [];
        //获取采样的数组
        var terrainSamplePositions = [];
        var length = 2048;
        var nar22 = [];
        nArr2.forEach((element, index) => {
            if (index < nArr2.length - 1) {
                var startLon = Cesium.Math.toRadians(element.x);
                var endLon   = Cesium.Math.toRadians(nArr2[index + 1].x);
                var starty   = Cesium.Math.toRadians(element.y);
                var endy     = Cesium.Math.toRadians(nArr2[index + 1].y);
                for (var i = 0; i < length; ++i) {
                    var x   = Cesium.Math.lerp(element.x, nArr2[index + 1].x, i / (length - 1));
                    var y   = Cesium.Math.lerp(element.y, nArr2[index + 1].y, i / (length - 1));
                    var lon = Cesium.Math.lerp(startLon, endLon, i / (length - 1));
                    var lat = Cesium.Math.lerp(starty, endy, i / (length - 1));
                    var position = new Cesium.Cartographic(lon, lat);
                    terrainSamplePositions.push(position);
                    nar22.push(x)
                    nar22.push(y)
                };
            } else {
                var startLon = Cesium.Math.toRadians(element.x);
                var endLon = Cesium.Math.toRadians(nArr2[0].x);
                var starty = Cesium.Math.toRadians(element.y);
                var endy = Cesium.Math.toRadians(nArr2[0].y);
                for (var i = 0; i < length; ++i) {
                    var x = Cesium.Math.lerp(element.x, nArr2[0].x, i / (length - 1));
                    var y = Cesium.Math.lerp(element.y, nArr2[0].y, i / (length - 1));

                    var lon = Cesium.Math.lerp(startLon, endLon, i / (length - 1));
                    var lat = Cesium.Math.lerp(starty, endy, i / (length - 1));
                    var position = new Cesium.Cartographic(lon, lat);
                    terrainSamplePositions.push(position);
                    nar22.push(x)
                    nar22.push(y)
                };
            }
        });
        if ( viewer.terrainProvider._layers ) {
            //获取高程采样点数据
            var p1 = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, terrainSamplePositions)
            Promise.all([p1]).then((samples) => {
                samples = samples[0]
                for (let index = 0; index < samples.length; index++) {
                    maximumHeightsARR.push(samples[index].height);
                    minimumHeights.push(hhh[0] - config.height);
                };
                //添加四周边界面
                viewer.entities.add({
                    id: "entityDMBJ",
                    wall: {
                        positions: Cesium.Cartesian3.fromDegreesArray(nar22),
                        maximumHeights: maximumHeightsARR,
                        minimumHeights: minimumHeights,
                        material: new Cesium.ImageMaterialProperty({
                            image: config.side,
                            repeat: new Cesium.Cartesian2(30, 30),
                        }),
                    },
                });
            })
        } else {
            for (let index = 0; index < terrainSamplePositions.length; index++) {
                maximumHeightsARR.push( 0 );
                minimumHeights.push(hhh[0] - config.height);
            }
            viewer.entities.add({
                id: "entityDMBJ",
                wall: {
                    positions: Cesium.Cartesian3.fromDegreesArray(nar22),
                    maximumHeights: maximumHeightsARR,
                    minimumHeights: minimumHeights,
                    material: new Cesium.ImageMaterialProperty({
                        image: config.side,
                        repeat: new Cesium.Cartesian2(30, 30),
                    }),
                },
            });
        }
    };
    /**
     * @description 移除添加的实体面数据
     */
    removeEntity(){
        try {
            viewer.entities.removeById("entityDM");
            viewer.entities.removeById("entityDMBJ");
        } catch (error) { 
            console.log(error);
        };
    }
    /**
     * @description 判断是否是顺时针
     * @param {*} latLngArr 
     * @returns 
     */
    isClockWise(latLngArr) {
        if (latLngArr.length < 3) {
            return null
        }
        if (latLngArr[0] === latLngArr[latLngArr.length - 1]) {
            latLngArr = latLngArr.slice(0, latLngArr.length - 1)
        }
        let latMin = {
            i: -1,
            val: 100000000
        }
        for (let i = 0; i < latLngArr.length; i++) {
            let y = latLngArr[i].y
            if (y < latMin.val) {
                latMin.val = y
                latMin.i = i
            }
        }
        let i1 = (latMin.i + latLngArr.length - 1) % latLngArr.length
        let i2 = latMin.i
        let i3 = (latMin.i + 1) % latLngArr.length

        let v2_1 = {
            y: latLngArr[i2].y - latLngArr[i1].y,
            x: latLngArr[i2].x - latLngArr[i1].x
        }
        let v3_2 = {
            y: latLngArr[i3].y - latLngArr[i2].y,
            x: latLngArr[i3].x - latLngArr[i2].x
        }
        let result = v3_2.x * v2_1.y - v2_1.x * v3_2.y
        // result>0 3-2在2-1的顺时针方向 result<0 3-2在2-1的逆时针方向 result==0 3-2和2-1共线，可能同向也可能反向
        return result === 0 ? (latLngArr[i3].x < latLngArr[i1].x) : (result > 0)
    }
}

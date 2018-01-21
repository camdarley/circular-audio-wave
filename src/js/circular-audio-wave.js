class CircularAudioWave {
    constructor(elem, opts={}) {
        this.opts = opts;
        this.lastMaxR = 0;
        this.maxChartValue = 200;
        this.minChartValue = 60;
        this.chart = echarts.init(elem);
        this.playing = false;
        this.lineColorOffset = 0;
        this.tick = 0;
        this.defaultChartOption = {
            angleAxis: {
                type: 'value',
                clockwise: false,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    show: false,
                },
                splitLine: {
                    show: false,
                },
            },
            radiusAxis: {
                min: 0,
                max: this.maxChartValue + 50,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    show: false,
                },
                splitLine: {
                    show: false,
                },
            },
            polar: {
                radius: '100%',
            },
            series: [
                {
                    coordinateSystem: 'polar',
                    name: 'line',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        color: {
                            colorStops: [
                                { offset: 0.7, color: 'red' },
                                { offset: 0.3, color: 'blue'}
                            ],
                        },
                        // shadowColor: 'black',
                        // shadowBlur: 30,
                    },
                    zlevel: 2,
                    data: Array.apply(null, { length: 361 }).map(Function.call, i => {
                        return [this.minChartValue, i];
                    }),
                    silent: true,
                    animation: false,
                },
                {
                    coordinateSystem: 'polar',
                    name: 'maxbar',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        color: 'green',
                        // shadowColor: 'black',
                        // shadowBlur: 20,
                    },
                    data: Array.apply(null, { length: 361 }).map(Function.call, i => {
                        return [this.minChartValue, i];
                    }),
                    silent: true,
                    animation: false,
                },
            ]
        };
        // check if the default naming is enabled, if not use the chrome one.
        if (!window.AudioContext) {
            if (!window.webkitAudioContext) {
                alert('Your browser does not support AudioContext');
            }
            window.AudioContext = window.webkitAudioContext;
        }
        else {
            this.context = new AudioContext();
            this.sourceNode = this.context.createBufferSource();
            this.sourceNode.loop = !!this.opts.loop;
            this.analyser = this.context.createAnalyser();
        }


        if (this.opts.mode === 'sunburst') {
            let colors = ['#FFAE57', '#FF7853', '#EA5151', '#CC3F57', '#9A2555'];
            let bgColor = '#2E2733';
            
            let data = [
                {
                    children: [ {
                            children: []
                    }],
                }, 
                {
                    children: [{
                        children: []
                    }],
                },
            ];
            for (let i = 0 ; i < 5; i++) {
                data[0].children[0].children.push(
                    {
                        name: '-',
                        children: [{
                            name: ''
                        }]
                    },
                );
                data[1].children[0].children.push(
                    {
                        name: '-',
                        children: [{
                            name: ''
                        }]
                    },
                );
            }

            // loop to the bottom children
            data.forEach(level0 => {
                level0.children.forEach(level1 => {
                    level1.children.forEach((item) => {
                        item.children[0].value = 1;
                    })
                })
            });
            
            this.defaultChartOption = {
                backgroundColor: bgColor,
                color: colors,
                series: [{
                    type: 'sunburst',
                    center: ['50%', '48%'],
                    data: data,
                    nodeClick: false,
                    sort: function (a, b) {
                        if (a.depth === 1) {
                            return b.getValue() - a.getValue();
                        }
                        else {
                            return a.dataIndex - b.dataIndex;
                        }
                    },
                    itemStyle: {
                        borderColor: bgColor,
                        borderWidth: 2
                    },
                    levels: [{}, {
                        r0: 0,
                        r: 40,
                    }, {
                        r0: 40,
                        r: 105
                    }, {
                        r0: 115,
                        r: 140,
                        itemStyle: {
                            shadowBlur: 2,
                            shadowColor: colors[2],
                            color: 'transparent'
                        },
                        label: {
                            rotate: 'tangential',
                            fontSize: 10,
                            color: colors[0]
                        }
                    }, {
                        r0: 140,
                        r: 145,
                        itemStyle: {
                            shadowBlur: 80,
                            shadowColor: colors[0],
                            color: colors[0]
                        },
                        label: {
                            position: 'outside',
                            textShadowBlur: 5,
                            textShadowColor: '#333',
                            backgroundColor: colors[0],
                        },
                    }]
                }]
            };
        }
        

        this.chartOption = JSON.parse(JSON.stringify(this.defaultChartOption));
        

























    }
    loadAudio(filePath) {
        console.log(filePath);
        this.filePath = filePath;
        this._setupAudioNodes();
        var request = new XMLHttpRequest();
        request.open('GET', filePath, true);
        request.responseType = 'arraybuffer';
        request.send();
        return new Promise((resolve, reject) => {
            request.onload = () => {
                this.context.decodeAudioData(
                    request.response, 
                    buffer => {
                        this.sourceNode.buffer = buffer;
                        this.generateWave();
                        resolve();
                    },
                    e => console.log(e)
                );
            };
        });
    }
    generateWave() {
        this.chart.setOption(this.chartOption, true);
    }
    play() {
        if (this.sourceNode && this.sourceNode.buffer) {
            this.playing = true;
            this.sourceNode.start(0);
            this._drawAnaimation();
        }
        else {
            alert('Audio is not ready');
        }
    }
    // TODO
    pause() {
       
    }
    destroy() {
        this.chart.dispose();
    }
    reset() {
        this.chartOption = JSON.parse(JSON.stringify(this.defaultChartOption));
        this.generateWave();
    }
    // TODO: Allow callback
    onended() {
        if (!this.opts.loop) {
            this.playing = false;
            this.context.close();
            this.sourceNode.buffer = null;
            this.reset();

            this.context = new AudioContext();
            this.sourceNode = this.context.createBufferSource();
            this.analyser = this.context.createAnalyser();
            this.loadAudio(this.filePath)
        }
    }
    _setupAudioNodes() {
        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.fftSize = 2048;

        this.sourceNode.connect(this.analyser);

        this.sourceNode.connect(this.context.destination);
        this.sourceNode.onended = this.onended.bind(this);
    }
    _drawAnaimation() {
        let freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqData);
        this._draw(freqData);
        requestAnimationFrame(this._drawAnaimation.bind(this));
    }
    _draw(freqData) {
        if (this.playing) {
            let waveData = this._generateWaveData(freqData);
            this.chartOption.series[0].data = waveData.data;

            if (waveData.maxR > this.lastMaxR) {
                this.lastMaxR = waveData.maxR;
            }
            else {
                this.lastMaxR -= 4;
            }

            // maxbar
            if (this.opts.mode !== 'sunburst') {
                this.chartOption.series[1].data = Array.apply(null, { length: 361 }).map(Function.call, (i) => {
                    return [this.lastMaxR, i];
                });
            }
            this.chart.setOption(this.chartOption, true);
        }
    }
    _generateWaveData(data) {
        let waveData = [];
        let maxR = 0;
        for (let i = 0; i <= 360; i++) {
            // (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin
            let freq = data[i];
            var r = (((freq - 0) * (this.maxChartValue - this.minChartValue)) / (255 - 0)) + this.minChartValue;
            if (r > maxR) {
                maxR = r;
            }
            waveData.push([r, i]);
        }
        waveData.push([waveData[0][0], 360]);

        if (this.opts.mode === 'sunburst') {
            waveData = JSON.parse(JSON.stringify(this.chartOption.series[0].data));;
            let index = 0;
            waveData.forEach(level0 => {
                level0.children.forEach(level1 => {
                    level1.children.forEach((item) => {
                        let freq = data[index];
                        var r = (((freq - 0) * (20 - 0)) / (255 - 0)) + 0;

                        item.children[0].name = Array.apply(null, { length: r }).map(Function.call, i => {
                            return '';
                        }).join(' ');
                        index++;
                    })
                })
            });
        }
        return { maxR: maxR, data: waveData };
    };
}
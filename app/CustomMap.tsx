import React, { useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Example schematic: simple building with rooms and corridors
const schematic = [
    // Walls (x1, y1, x2, y2)
    { type: 'wall', x1: 50, y1: 50, x2: 300, y2: 50 },
    { type: 'wall', x1: 300, y1: 50, x2: 300, y2: 300 },
    { type: 'wall', x1: 300, y1: 300, x2: 50, y2: 300 },
    { type: 'wall', x1: 50, y1: 300, x2: 50, y2: 50 },
    // Room divider
    { type: 'wall', x1: 175, y1: 50, x2: 175, y2: 300 },
    // Doorway (just for visual, not interactive)
    { type: 'door', x1: 175, y1: 175, x2: 300, y2: 175 },
];

const MAP_WIDTH = 400;
const MAP_HEIGHT = 400;

const CustomMap = () => {
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const scale = useRef(new Animated.Value(1)).current;
    const lastPan = useRef({ x: 0, y: 0 });
    const lastScale = useRef<{ current: number; currentDistance?: number }>({ current: 1 });
    const [isZooming, setIsZooming] = useState(false);

    // PanResponder for drag and pinch-to-zoom
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                if (gestureState.numberActiveTouches === 2) {
                    setIsZooming(true);
                if (lastPan.current.x === 0 && lastPan.current.y === 0) {
                    lastPan.current = {
                        x: (pan as any)._value.x,
                        y: (pan as any)._value.y,
                    };
                }
                if (gestureState.numberActiveTouches === 2) {
                    // Pinch to zoom
                    const touches = evt.nativeEvent.touches;
                    if (touches.length === 2) {
                        const dx = touches[0].pageX - touches[1].pageX;
                        const dy = touches[0].pageY - touches[1].pageY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (!lastScale.current.currentDistance) {
                            lastScale.current.currentDistance = distance;
                        } else {
                            const scaleChange = distance / lastScale.current.currentDistance!;
                            let newScale = lastScale.current.current * scaleChange;
                            newScale = Math.max(0.5, Math.min(2.5, newScale));
                            scale.setValue(newScale);
                        }
                    }
                } else if (!isZooming) {
                    // Drag to pan
                    pan.setValue({
                        x: lastPan.current.x + gestureState.dx,
                        y: lastPan.current.y + gestureState.dy,
                    });
                }
            }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (isZooming) {
                    lastScale.current.current = (scale as any)._value;
                    lastScale.current.currentDistance = undefined;
                    setIsZooming(false);
                } else {
                    lastPan.current = {
                        x: lastPan.current.x + gestureState.dx,
                        y: lastPan.current.y + gestureState.dy,
                    };
                }
            },
            onPanResponderTerminationRequest: () => false,
        })
    ).current;

    // Hide scrollbars on web (optional, no effect on native)
    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            const original = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = original;
            };
        }
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                style={{
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: scale },
                    ],
                }}
                {...panResponder.panHandlers}
            >
                <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={styles.svg}>
                    {/* Background */}
                    <Rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#f5f5f5" />
                    {/* Draw schematic */}
                    {schematic.map((item, idx) =>
                        item.type === 'wall' ? (
                            <Line
                                key={idx}
                                x1={item.x1}
                                y1={item.y1}
                                x2={item.x2}
                                y2={item.y2}
                                stroke="#333"
                                strokeWidth={4}
                            />
                        ) : (
                            <Line
                                key={idx}
                                x1={item.x1}
                                y1={item.y1}
                                x2={item.x2}
                                y2={item.y2}
                                stroke="#4caf50"
                                strokeWidth={6}
                                strokeDasharray="12,6"
                            />
                        )
                    )}
                </Svg>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
    },
});

export default CustomMap;
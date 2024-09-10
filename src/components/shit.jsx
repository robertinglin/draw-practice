import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getStroke } from 'perfect-freehand';

const MIN_DISTANCE = 1; // Minimum distance between points in pixels

const DrawingCanvas = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isErasing, setIsErasing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [allStrokes, setAllStrokes] = useState([
        {
            "points": [
              [
                136,
                85,
                0
              ],
              [
                650,
                724,
                0
              ]
            ],
            "isEraser": false
          },
          {
            "points": [
              [
                560,
                180,
                0
              ],
              [
                149,
                561,
                2.0344439357957027
              ]
            ],
            "isEraser": true
          }

    ]);

    const getStrokePoints = useCallback((stroke) => {
        return getStroke(stroke, {
            size: 64,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            start: {
                cap: false,
                taper: 0,
                easing: (t) => t,
              },
              end: {
                cap: false,
                taper: 0,
                easing: (t) => t,
              },
        });
    }, []);

    // Helper function to calculate line intersection
    const lineIntersection = (p1, p2, p3, p4) => {
        const x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];
        const x3 = p3[0], y3 = p3[1], x4 = p4[0], y4 = p4[1];

        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return null; // parallel lines

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null; // out of segment bounds

        const x = x1 + ua * (x2 - x1);
        const y = y1 + ua * (y2 - y1);

        return [x, y];
    };
    

    // const getStrokeSimple = (stroke) => {
    //     //getStrokePoints(stroke).filter((point, i, strokePoints) => {
    //     // if (i === 0) return true; // Keep the first point
    //     // let prevPoint = strokePoints[i - 1];
    //     // let currentPoint = point;
    //     // let distance = Math.sqrt(
    //     //     Math.pow(currentPoint[0] - prevPoint[0], 2) +
    //     //     Math.pow(currentPoint[1] - prevPoint[1], 2)
    //     // );
    //     // return distance >= MIN_DISTANCE;
    //     return  [[
    //         300,
    //         500
    //       ],
          
    //       [
    //         300,
    //         200,
            
    //       ],
    //       [
    //           400,
    //           200,
    //         ],
          
    //       [
    //           400,
    //           500,
    //         ],
    //       [
    //           300,
    //           500,
    //         ]
    //     ]
    // };

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const eraserPoints = [
            [
              500,
              300
            ],
            
            [
              200,
              300
            ],
            [
                200,
                400,
            ],
            
            [
                500,
                400
            ],
            [
                500,
                300
              ]
          ]

        console.log('ALL STROKES', allStrokes);

        allStrokes.forEach((stroke, strokeIndex) => {
            if (stroke.isEraser) {
                // Draw eraser strokes
                const eraserPoints = getStrokePoints(stroke.points);
                // console.log(eraserPoints)
                ctx.strokeStyle = 'red';
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.moveTo(eraserPoints[0][0], eraserPoints[0][1]);
                eraserPoints.forEach(point => {
                    ctx.lineTo(point[0], point[1]);
                });
                ctx.stroke();
                
                eraserPoints.forEach(point => {
                    ctx.beginPath();
                    ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
                    ctx.fill();
                });
                return;
            }

            let strokePoints = getStrokePoints(stroke.points)

            

            console.log(strokePoints);
            const intersections = [];
            function addIntersectionsToStroke(stroke1, stroke2) {
                let newStroke = [];
                let foundIntersections = [];
            
                for (let i = 1; i < stroke1.length; i++) {
                    const segmentIntersections = [];
                    for (let j = 1; j < stroke2.length; j++) {
                        const intersection = lineIntersection(
                            stroke1[i-1], stroke1[i],
                            stroke2[j-1], stroke2[j]
                        );
                       
                        if (intersection) {
                            const t = getParametricT(stroke1[i-1], stroke1[i], intersection);
                            segmentIntersections.push({ point: intersection, t: t });
                        }
                    }
            
                    // Sort intersections within this segment based on their parametric t value
                    segmentIntersections.sort((a, b) => a.t - b.t);
            
                    // Add the previous point from stroke1
                    newStroke.push(stroke1[i-1]);
            
                    // Add sorted intersections for this segment
                    segmentIntersections.forEach(({ point }) => {
                        newStroke.push({
                            [0]: point[0],
                            [1]: point[1],
                            isIntersection: true
                        });
                    });
                }
            
                // Add the last point from stroke1
                newStroke.push(stroke1[stroke1.length - 1]);
            
                return newStroke;
            }
            
            // Helper function to calculate the parametric t value of an intersection point
            function getParametricT(p1, p2, intersection) {
                if (p2[0] - p1[0] !== 0) {
                    return (intersection[0] - p1[0]) / (p2[0] - p1[0]);
                } else {
                    return (intersection[1] - p1[1]) / (p2[1] - p1[1]);
                }
            }
            
            strokePoints = addIntersectionsToStroke(strokePoints, eraserPoints);

            // // Find all intersections with eraser strokes
            // allStrokes.forEach((eraserStroke, eraserIndex) => {
            //     if (!eraserStroke.isEraser) return;

            //     // const eraserPoints = getStrokeSimple(eraserStroke.points);

            //     // const intersections = [];

            //     for (let i = 1; i < strokePoints.length; i++) {
            //         for (let j = 1; j < eraserPoints.length; j++) {
            //             const intersection = lineIntersection(
            //                 strokePoints[i - 1], strokePoints[i],
            //                 eraserPoints[j - 1], eraserPoints[j]
            //             );
            //             console.log(intersection);
            //             if (intersection) {
            //                 // i++;
            //                 // strokePoints.splice(i, 0, intersection);
            //                 intersections.push({ point: intersection, eraserIndex, strokeIndex: i - 1 });
            //             }
            //         }
            //     }

            // });

            // console.log(intersections)
            // // Sort intersections by their position in the stroke
            // intersections.sort((a, b) => a.strokeIndex - b.strokeIndex);

            // let intersectionOffset = 0;
            // intersections.forEach(({ point,  strokeIndex }) => {
            //     strokePoints.splice(strokeIndex + intersectionOffset, 0, point);
            //     intersectionOffset++;
            // });


            // Draw the stroke segments
            let lastPoint = strokePoints[0];
            let lastEraserIndex = null;

            ctx.beginPath();
            ctx.moveTo(lastPoint[0], lastPoint[1]);

            console.log(strokePoints);
            for (let i = 0; i <= strokePoints.length; i++) {
                const point = i < strokePoints.length ? strokePoints[i] : null;
                console.log(i, point, lastEraserIndex)
                // const intersectionsAtIndex = intersections.filter(int => int.strokeIndex === i - 1);

                // console.log(i, intersectionsAtIndex);


                // if (intersectionsAtIndex.length > 0) {
                //     // Draw to each intersection point
                //     intersectionsAtIndex.forEach(({ point: intPoint, eraserIndex }) => {
                //         if (lastEraserIndex === eraserIndex) {
                //             ctx.strokeStyle = 'purple';
                //         } else {
                //             ctx.strokeStyle = 'blue';
                //         }
                //         ctx.lineTo(intPoint[0], intPoint[1]);
                //         ctx.stroke();
                //         ctx.beginPath();
                //         ctx.moveTo(intPoint[0], intPoint[1]);
                //         lastEraserIndex = eraserIndex;
                //     });
                if (point) {

                    // No intersections, continue the line
                    if (lastEraserIndex === null) {
                        ctx.strokeStyle = 'blue';
                        ctx.globalAlpha = 1;
                    } else {
                        console.log('INTERSECTION')
                        ctx.strokeStyle = 'purple';
                        ctx.globalAlpha = 0;
                    }
                    ctx.lineTo(point[0], point[1]);
                    ctx.fillText(" " + i, point[0], point[1]);

                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(point[0], point[1]);
                    
                    if (lastEraserIndex == null && point.isIntersection) {
                        lastEraserIndex = i;
                    } else if (lastEraserIndex !== null && point.isIntersection) {
                        lastEraserIndex = null;
                    }
                    
                    
                }
                

                if (!point) {
                    // End of the stroke
                    ctx.stroke();
                }

                lastPoint = point || lastPoint;
            }

            // Draw intersection points
            ctx.fillStyle = 'red';
            intersections.forEach(({ point }) => {
                ctx.beginPath();
                ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
                ctx.fill();
            });

            console.log('DRAWING POINTS')
            for (let i = 1; i < strokePoints.length; i++) {
                ctx.fillStyle = 'blue';
                if (i === 1) {
                    ctx.fillStyle = 'magenta';
                } else if (i === 2) {
                    ctx.fillStyle = 'cyan';
                } else if (i === 3) {
                    ctx.fillStyle = 'yellow';
                } else if (i === 4) {
                    ctx.fillStyle = 'green';
                } else if (i === 5) {
                    ctx.fillStyle = 'orange';
                } else if (i === 6) {
                    ctx.fillStyle = 'purple';
                } else if (i === 7) {
                    ctx.fillStyle = 'brown';
                } else if (i === 8) {
                    ctx.fillStyle = 'pink';
                } else if (i === 9) {
                    ctx.fillStyle = 'gray';
                }
                ctx.beginPath();
                ctx.arc(strokePoints[i][0], strokePoints[i][1], 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });

        // Draw current stroke
        if (currentStroke.length > 0) {
            const strokePoints = getStrokeSimple(currentStroke);
            ctx.strokeStyle = isErasing ? 'red' : 'blue';
            ctx.beginPath();
            ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);
            strokePoints.forEach(point => {
                ctx.lineTo(point[0], point[1]);
            });
            ctx.stroke();
        }
    }, [allStrokes, currentStroke, isErasing, getStrokePoints]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }, []);

    useEffect(() => {
        redrawCanvas();
    }, [allStrokes, currentStroke, redrawCanvas]);

    const getCanvasPoint = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return [0, 0];

        const rect = canvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }, []);

    const handlePointerDown = useCallback((e) => {
        setIsDrawing(true);
        const [x, y] = getCanvasPoint(e);
        setCurrentStroke([[x, y, 0]]);  // Initial angle is 0
    }, [getCanvasPoint]);

    const handlePointerMove = useCallback((e) => {
        if (!isDrawing) return;
        const [x, y] = getCanvasPoint(e);

        setCurrentStroke(prev => {
            const lastPoint = prev[prev.length - 1];
            const dx = x - lastPoint[0];
            const dy = y - lastPoint[1];
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance >= MIN_DISTANCE) {
                const angle = Math.atan2(dy, dx);
                return [...prev, [x, y, angle]];
            }
            return prev;
        });

    }, [isDrawing, getCanvasPoint]);

    const handlePointerUp = useCallback(() => {
        if (currentStroke.length > 0) {
            setAllStrokes(prev => [...prev, { points: currentStroke, isEraser: isErasing }]);
        }
        setIsDrawing(false);
        setCurrentStroke([]);
    }, [currentStroke, isErasing]);

    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={isErasing}
                    onChange={(e) => setIsErasing(e.target.checked)}
                />
                Eraser Mode
            </label>
            <canvas
                ref={canvasRef}
                width={1000}
                height={1000}
                style={{ border: '1px solid black', touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            />
        </div>
    );
};

export default DrawingCanvas;
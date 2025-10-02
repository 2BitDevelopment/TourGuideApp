import { MapPin, Navigation, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Marker type
type Marker = {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
};

type MapState = {
  x: number;
  y: number;
  zoom: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  mapStart: { x: number; y: number };
};

const MapViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [mapState, setMapState] = useState<MapState>({
    x: 0,
    y: 0,
    zoom: 1,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    mapStart: { x: 0, y: 0 }
  });

  // Sample markers data
  const [markers, setMarkers] = useState<Marker[]>(
    [
      { id: 1, x: 100, y: 150, label: 'Location A', color: '#ef4444' },
      { id: 2, x: 300, y: 200, label: 'Location B', color: '#3b82f6' },
      { id: 3, x: 450, y: 300, label: 'Location C', color: '#10b981' }
    ]
  );

  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  // Update canvas size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw the map
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas width/height to match device size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context for transformations
    ctx.save();

    // Apply zoom and pan transformations
    ctx.translate(mapState.x, mapState.y);
    ctx.scale(mapState.zoom, mapState.zoom);

    // Draw map background (grid pattern)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const startX = Math.floor(-mapState.x / (mapState.zoom * gridSize)) * gridSize;
    const startY = Math.floor(-mapState.y / (mapState.zoom * gridSize)) * gridSize;
    const endX = startX + (width / mapState.zoom) + gridSize;
    const endY = startY + (height / mapState.zoom) + gridSize;

    // Vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw some sample terrain features
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.arc(250, 250, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(400, 100, 150, 100);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(50, 350);
    ctx.lineTo(200, 300);
    ctx.lineTo(180, 400);
    ctx.closePath();
    ctx.fill();

    // Draw markers
    markers.forEach(marker => {
      ctx.fillStyle = marker.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Marker pin shape
      ctx.beginPath();
      ctx.arc(marker.x, marker.y - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Marker point
      ctx.beginPath();
      ctx.moveTo(marker.x, marker.y);
      ctx.lineTo(marker.x - 4, marker.y - 12);
      ctx.lineTo(marker.x + 4, marker.y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label
      if (selectedMarker === marker.id) {
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, marker.x, marker.y - 25);
      }
    });

    // Restore context
    ctx.restore();
  }, [mapState, markers, selectedMarker, canvasSize]);

  // Handle mouse/touch events
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check if clicking on a marker
    const worldX = (x - mapState.x) / mapState.zoom;
    const worldY = (y - mapState.y) / mapState.zoom;

    let clickedMarker: number | null = null;
    markers.forEach(marker => {
      const distance = Math.sqrt(
        Math.pow(worldX - marker.x, 2) + Math.pow(worldY - marker.y, 2)
      );
      if (distance <= 15) {
        clickedMarker = marker.id;
      }
    });

    if (clickedMarker !== null) {
      setSelectedMarker(selectedMarker === clickedMarker ? null : clickedMarker);
    } else {
      setMapState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { x, y },
        mapStart: { x: prev.x, y: prev.y }
      }));
      setSelectedMarker(null);
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!mapState.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const deltaX = x - mapState.dragStart.x;
    const deltaY = y - mapState.dragStart.y;

    setMapState(prev => ({
      ...prev,
      x: prev.mapStart.x + deltaX,
      y: prev.mapStart.y + deltaY
    }));
  };

  const handlePointerUp = () => {
    setMapState(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, mapState.zoom * zoomFactor));

    // Zoom towards mouse position
    const zoomPoint = {
      x: (mouseX - mapState.x) / mapState.zoom,
      y: (mouseY - mapState.y) / mapState.zoom
    };

    setMapState(prev => ({
      ...prev,
      zoom: newZoom,
      x: mouseX - zoomPoint.x * newZoom,
      y: mouseY - zoomPoint.y * newZoom
    }));
  };

  const zoomIn = () => {
    setMapState(prev => ({
      ...prev,
      zoom: Math.min(5, prev.zoom * 1.2)
    }));
  };

  const zoomOut = () => {
    setMapState(prev => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom * 0.8)
    }));
  };

  const resetView = () => {
    setMapState(prev => ({
      ...prev,
      x: 0,
      y: 0,
      zoom: 1
    }));
  };

  const addMarker = () => {
    const newMarker: Marker = {
      id: Date.now(),
      x: Math.random() * 500 + 50,
      y: Math.random() * 400 + 50,
      label: `Location ${markers.length + 1}`,
      color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)]
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  // Track pinch state
  const pinchState = useRef<{
    initialDistance: number | null;
    initialZoom: number;
    initialCenter: { x: number; y: number } | null;
    initialPan: { x: number; y: number };
  }>({
    initialDistance: null,
    initialZoom: 1,
    initialCenter: null,
    initialPan: { x: 0, y: 0 }
  });

  // Pinch-to-zoom handler
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const x1 = touch1.clientX - rect.left;
      const y1 = touch1.clientY - rect.top;
      const x2 = touch2.clientX - rect.left;
      const y2 = touch2.clientY - rect.top;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };

      if (pinchState.current.initialDistance === null) {
        pinchState.current.initialDistance = distance;
        pinchState.current.initialZoom = mapState.zoom;
        pinchState.current.initialCenter = center;
        pinchState.current.initialPan = { x: mapState.x, y: mapState.y };
        return;
      }

      const scale = distance / pinchState.current.initialDistance;
      let newZoom = Math.max(0.1, Math.min(5, pinchState.current.initialZoom * scale));

      // Zoom towards pinch center
      const zoomPoint = {
        x: (center.x - pinchState.current.initialPan.x) / pinchState.current.initialZoom,
        y: (center.y - pinchState.current.initialPan.y) / pinchState.current.initialZoom
      };

      setMapState(prev => ({
        ...prev,
        zoom: newZoom,
        x: center.x - zoomPoint.x * newZoom,
        y: center.y - zoomPoint.y * newZoom
      }));
    } else if (e.touches.length === 1) {
      // fallback to drag
      handlePointerMove(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    pinchState.current.initialDistance = null;
    pinchState.current.initialZoom = mapState.zoom;
    pinchState.current.initialCenter = null;
    pinchState.current.initialPan = { x: mapState.x, y: mapState.y };
    handlePointerUp();
  };

  // Redraw when state changes
  useEffect(() => {
    drawMap();
  }, [drawMap]);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">St. George's Cathedral</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Zoom: {(mapState.zoom * 100).toFixed(0)}%</span>
          <a href="/ThankYou" className="px-3 py-1 rounded-full bg-rose-700 text-white">Finish</a>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{
            width: '100vw',
            height: '100vh',
            cursor: mapState.isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        />

        {/* Control Panel */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
          <button
            onClick={zoomIn}
            className="w-full flex items-center justify-center p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={zoomOut}
            className="w-full flex items-center justify-center p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={resetView}
            className="w-full flex items-center justify-center p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={addMarker}
            className="w-full flex items-center justify-center p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            <MapPin size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <Navigation size={16} className="mr-2" />
            Map Legend
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
              <span>Water Body</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
              <span>Park Area</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
              <span>Desert Area</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            • Click and drag to pan
            • Scroll to zoom
            • Click markers for info
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t p-2 flex justify-between items-center text-sm text-gray-600">
        <div>
          Position: ({Math.round(-mapState.x)}, {Math.round(-mapState.y)})
        </div>
        <div>
          Markers: {markers.length} | Selected: {selectedMarker ? `#${selectedMarker}` : 'None'}
        </div>
      </div>
    </div>
  );
};

export default MapViewer;



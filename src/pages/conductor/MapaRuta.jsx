import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiMap2Line, RiNavigationFill, RiCheckboxCircleFill } from 'react-icons/ri';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const TruckIcon = L.divIcon({
    html: `<div style="background-color: #4f46e5; padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center;">
            <svg stroke="currentColor" fill="white" stroke-width="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 15V17H11V15H7ZM13 15V17H17V15H13ZM2 3H17C17.5523 3 18 3.44772 18 4V8H21C21.5523 8 22 8.44772 22 9V18C22 18.5523 21.5523 19 21 19H19C19 20.6569 17.6569 22 16 22C14.3431 22 13 20.6569 13 19H7C7 20.6569 5.65685 22 4 22C2.34315 22 1 20.6569 1 19H1V11.125C1 10.5186 1.35334 9.9723 1.91004 9.72488L5.27508 8.22931C5.72266 8.03038 6 7.58554 6 7.09641V4C6 3.44772 5.55228 3 5 3H2V3ZM6 10.1654L3 11.5V17H4.17419C4.58661 15.8291 5.69421 15 7 15C8.30579 15 9.41339 15.8291 9.82581 17H11.1742C11.5866 15.8291 12.6942 15 14 15C15.3058 15 16.4134 15.8291 16.8258 17H20V10H16V13H6V10.1654ZM16 5V8H4V7.09641L6.47161 5.99804C6.7849 5.85879 7 5.5474 7 5.20455V5H16ZM4 17C3.44772 17 3 17.4477 3 18C3 18.5523 3.44772 19 4 19C4.55228 19 5 18.5523 5 18C5 17.4477 4.55228 17 4 17ZM16 17C15.4477 17 15 17.4477 15 18C15 18.5523 15.4477 19 16 19C16.5523 19 17 18.5523 17 18C17 17.4477 16.5523 17 16 17Z"></path></svg>
         </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

// CONTROLADOR DINÁMICO DE CÁMARA
const MapController = ({ origen, destino, viajeIniciado }) => {
    const map = useMap();
    
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
            if (viajeIniciado && origen) {
                // Sigue al camión suavemente en tiempo real manteniendo el zoom cerca de las calles
                map.setView(origen, 17, { animate: true, duration: 0.5 });
            } else if (origen && destino) {
                const bounds = L.latLngBounds([origen, destino]);
                map.fitBounds(bounds, { padding: [60, 60] });
            }
        }, 100);
    }, [map, origen, destino, viajeIniciado]);

    return null;
};

const MapaRuta = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Posición inicial (Base) del conductor
    const [coordenadasBase, setCoordenadasBase] = useState([19.417889, -98.999611]);
    const [puntosCamino, setPuntosCamino] = useState([]);
    const [viajeIniciado, setViajeIniciado] = useState(false);
    const [infoRuta, setInfoRuta] = useState({ distancia: 'Calculando...', tiempo: '...' });

    const { latDestino, lngDestino, descripcion } = location.state || {};

    // 1. Obtener trazo de calles inicial desde OSRM
    useEffect(() => {
        if (!latDestino || !lngDestino) return;

        const obtenerRutaCalles = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${coordenadasBase[1]},${coordenadasBase[0]};${lngDestino},${latDestino}?overview=full&geometries=geojson`;
                const respuesta = await fetch(url);
                const data = await respuesta.json();

                if (data.routes && data.routes.length > 0) {
                    const coordenadasMapeadas = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setPuntosCamino(coordenadasMapeadas);

                    const kms = (data.routes[0].distance / 1000).toFixed(1);
                    const mins = Math.round(data.routes[0].duration / 60);
                    setInfoRuta({ distancia: `${kms} km`, tiempo: `${mins} min` });
                } else {
                    setPuntosCamino([coordenadasBase, [latDestino, lngDestino]]);
                }
            } catch (error) {
                console.error("Error al trazar calles:", error);
                setPuntosCamino([coordenadasBase, [latDestino, lngDestino]]);
            }
        };

        obtenerRutaCalles();
    }, [latDestino, lngDestino]);

    // 2. SIMULACIÓN DE MOVIMIENTO REAL PASO A PASO
    useEffect(() => {
        if (!viajeIniciado || puntosCamino.length === 0) return;

        let indiceActual = 0;
        
        // Calculamos el intervalo ideal. Para que tarde aprox. 2.5 - 3 minutos en recorrer todas las coordenadas
        // dividimos el tiempo objetivo entre la cantidad de puntos de la línea de la calle.
        // 1500ms a 2000ms por punto da una velocidad fluida y realista de recorrido de calles.
        const tiempoPorSegmento = Math.max(1000, Math.min(2500, 160000 / puntosCamino.length));

        const intervaloSimulacion = setInterval(() => {
            if (indiceActual < puntosCamino.length - 1) {
                indiceActual++;
                const siguientePosicion = puntosCamino[indiceActual];
                
                // Movemos el camión al siguiente punto físico de la calle
                setCoordenadasBase(siguientePosicion);

                // Va disminuyendo el tiempo estimado en el panel superior conforme avanza
                setInfoRuta(prev => {
                    const totalPuntos = puntosCamino.length;
                    const porcentajeRestante = (totalPuntos - indiceActual) / totalPuntos;
                    const minsOriginales = parseFloat(prev.tiempo) || 15;
                    const nuevoTiempo = Math.max(1, Math.round(minsOriginales * porcentajeRestante));
                    return {
                        ...prev,
                        tiempo: `${nuevoTiempo} min`
                    };
                });
            } else {
                // El camión llegó exactamente a tus coordenadas de destino
                clearInterval(intervaloSimulacion);
                setInfoRuta({ distancia: '0.0 km', tiempo: '¡Llegó!' });
            }
        }, tiempoPorSegmento);

        return () => clearInterval(intervaloSimulacion);
    }, [viajeIniciado, puntosCamino]);

    if (!latDestino || !lngDestino) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-gray-50">
                <RiMap2Line size={64} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-black text-gray-800 mb-2">Sin ruta activa</h2>
                <button onClick={() => navigate('/conductor/rutas')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100">
                    Volver a Mis Rutas
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-100 font-sans">
            
            {/* PANEL SUPERIOR DINÁMICO */}
            <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
                <div className="flex justify-between items-start w-full">
                    {!viajeIniciado && (
                        <button 
                            onClick={() => navigate(-1)}
                            className="pointer-events-auto bg-white p-4 rounded-2xl shadow-xl border border-gray-100 text-gray-700 active:scale-90 transition-all"
                        >
                            <RiArrowLeftLine size={24} />
                        </button>
                    )}

                    <div className={`pointer-events-auto bg-white p-5 rounded-[2rem] shadow-2xl border border-gray-100 w-full ${viajeIniciado ? '' : 'max-w-[280px] ml-auto'}`}>
                        {viajeIniciado ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 animate-pulse">
                                        <RiNavigationFill size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">En Navegación Activa</h4>
                                        <p className="text-sm font-black text-gray-800 leading-tight">
                                            Dirígete a: {descripcion?.split('|')[0].replace(/[[\]]/g, '') || "Punto Asignado"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-gray-900">{infoRuta.tiempo}</span>
                                    <span className="text-xs font-bold text-gray-400">{infoRuta.distancia}</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Punto de Entrega</h4>
                                </div>
                                <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">
                                    {descripcion?.split('|')[0].replace(/[[\]]/g, '') || "Recolección General"}
                                </p>
                                <div className="mt-2 text-xs font-bold text-gray-500">
                                    Distancia estimada: <span className="text-indigo-600 font-black">{infoRuta.distancia}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CORRECCIÓN: BOTÓN MÁS ARRIBA (bottom-20) PARA EVITAR SCROLL */}
            <div className="absolute bottom-20 left-6 right-6 z-[1000] flex justify-center pointer-events-none">
                {!viajeIniciado ? (
                    <button
                        onClick={() => setViajeIniciado(true)}
                        className="pointer-events-auto w-full max-w-md bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl shadow-2xl shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-base tracking-wide"
                    >
                        <RiNavigationFill size={20} className="transform rotate-45" />
                        INICIAR VIAJE / RECOLECCIÓN
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            alert("¡Viaje finalizado con éxito!");
                            navigate('/conductor/rutas'); 
                        }}
                        className="pointer-events-auto w-full max-w-md bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl shadow-2xl shadow-emerald-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-base tracking-wide"
                    >
                        <RiCheckboxCircleFill size={22} />
                        MARCAR COMO RECOLECTADO
                    </button>
                )}
            </div>

            {/* Contenedor del Mapa */}
            <MapContainer 
                center={coordenadasBase} 
                zoom={14} 
                style={{ height: '100%', width: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                zoomControl={false} 
            >
               <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController origen={coordenadasBase} destino={[latDestino, lngDestino]} viajeIniciado={viajeIniciado} />

                {/* El Camino / Trazo de calles */}
                {puntosCamino.length > 0 && (
                    <Polyline 
                        positions={puntosCamino} 
                        color={viajeIniciado ? "#10b981" : "#4f46e5"} 
                        weight={viajeIniciado ? 6 : 5} 
                        opacity={0.9}
                        dashArray={viajeIniciado ? null : "2, 8"} 
                    />
                )}

                {/* Marcador del Camión (Su posición se actualiza en el loop) */}
                <Marker position={coordenadasBase} icon={TruckIcon}>
                    <Popup><div className="font-bold">Camión Recolector</div></Popup>
                </Marker>

                {/* Marcador del Destino */}
                <Marker position={[latDestino, lngDestino]} icon={DefaultIcon}>
                    <Popup>
                        <div className="font-bold text-center p-1">Punto de Acopio</div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapaRuta;
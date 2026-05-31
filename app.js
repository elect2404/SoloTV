// IPTV App - Main Controller
document.addEventListener('DOMContentLoaded', () => {
    // App State
    let allChannels = [];
    let filteredChannels = [];
    let favorites = JSON.parse(localStorage.getItem('iptv_favorites')) || [];
    let currentTab = 'all'; // 'all', 'movies', 'documentaries', 'favorites', 'country:<name>', 'lang:<name>'
    let viewMode = localStorage.getItem('iptv_view_mode') || 'grid'; // 'grid', 'list'
    let hlsPlayer = null;
    const countryNames = {
        'argentina': 'Argentina',
        'bolivia': 'Bolivia',
        'chile': 'Chile',
        'colombia': 'Colombia',
        'costa-rica': 'Costa Rica',
        'cuba': 'Cuba',
        'ecuador': 'Ecuador',
        'el-salvador': 'El Salvador',
        'espana': 'España',
        'estados-unidos': 'Estados Unidos',
        'guatemala': 'Guatemala',
        'honduras': 'Honduras',
        'mexico': 'México',
        'nicaragua': 'Nicaragua',
        'panama': 'Panamá',
        'paraguay': 'Paraguay',
        'peru': 'Perú',
        'puerto-rico': 'Puerto Rico',
        'republica-dominicana': 'República Dominicana',
        'uruguay': 'Uruguay',
        'venezuela': 'Venezuela',
        'internacionales': 'Internacionales'
    };

    // DOM Elements
    const channelsGrid = document.getElementById('channels-grid');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const viewModeToggle = document.getElementById('view-mode-toggle');
    
    const categoryTitle = document.getElementById('category-title');
    const categoryDesc = document.getElementById('category-desc');
    
    const countriesList = document.getElementById('countries-list');
    const languagesList = document.getElementById('languages-list');
    
    // Modal & Player Elements
    const playerModal = document.getElementById('player-modal');
    const videoPlayer = document.getElementById('video-player');
    const closePlayerModal = document.getElementById('close-player-modal');
    const modalChannelLogo = document.getElementById('modal-channel-logo');
    const modalChannelTitle = document.getElementById('modal-channel-title');
    const modalFavBtn = document.getElementById('modal-fav-btn');
    const playerError = document.getElementById('player-error');

    // Translations Dictionary
    const translations = {
        es: {
            allChannels: "Todos los Canales",
            movies: "Películas",
            documentaries: "Documentales",
            news: "Noticias",
            sports: "Deportes",
            favorites: "Favoritos",
            filterCountry: "Filtrar por País",
            filterLanguage: "Filtrar por Idioma",
            searchPlaceholder: "Buscar canal por nombre...",
            allChannelsDesc: "Explora nuestra colección completa de transmisiones en vivo.",
            moviesDesc: "Disfruta de películas de acción, romance, clásicos y más.",
            documentariesDesc: "Naturaleza, historia, ciencia y aventuras alrededor del mundo.",
            newsDesc: "Mantente informado con los acontecimientos más importantes del mundo.",
            sportsDesc: "Sigue tus deportes favoritos en vivo y directo.",
            favoritesDesc: "Acceso rápido a las emisoras que más te gustan.",
            countryDesc: "Explora la grilla de canales nacionales de {name}.",
            langDesc: "Transmisiones sintonizadas en idioma {name}.",
            noChannels: "No se encontraron canales",
            noChannelsDesc: "Intenta ajustar tu búsqueda o tus filtros.",
            channelError: "El canal no está disponible en este momento.",
            changeView: "Cambiar Vista",
            closePlayer: "Cerrar Reproductor",
            addFav: "Añadir a Favoritos",
            errorLoading: "Error al cargar los canales",
            errorLoadingDesc: "Asegúrate de que channels_with_streams.json existe en el directorio.",
            international: "Internacionales"
        },
        en: {
            allChannels: "All Channels",
            movies: "Movies",
            documentaries: "Documentaries",
            news: "News",
            sports: "Sports",
            favorites: "Favorites",
            filterCountry: "Filter by Country",
            filterLanguage: "Filter by Language",
            searchPlaceholder: "Search channel by name...",
            allChannelsDesc: "Explore our complete collection of live streams.",
            moviesDesc: "Enjoy action, romance, classic movies and more.",
            documentariesDesc: "Nature, history, science, and adventures around the world.",
            newsDesc: "Stay informed with the most important world events.",
            sportsDesc: "Follow your favorite sports live and direct.",
            favoritesDesc: "Quick access to the stations you love.",
            countryDesc: "Explore the national channel grid of {name}.",
            langDesc: "Streams tuned in {name} language.",
            noChannels: "No channels found",
            noChannelsDesc: "Try adjusting your search or filters.",
            channelError: "The channel is not available at the moment.",
            changeView: "Change View",
            closePlayer: "Close Player",
            addFav: "Add to Favorites",
            errorLoading: "Error loading channels",
            errorLoadingDesc: "Make sure channels_with_streams.json exists in the directory.",
            international: "International"
        }
    };

    function getBrowserLanguage() {
        const lang = navigator.language || navigator.userLanguage || "es";
        return lang.startsWith("en") ? "en" : "es";
    }

    const currentLang = getBrowserLanguage();
    const t = translations[currentLang];

    // Localize Static UI Text
    function localizeUI() {
        document.getElementById('link-all').innerHTML = `<i class="fa-solid fa-list"></i> ${t.allChannels}`;
        document.getElementById('link-movies').innerHTML = `<i class="fa-solid fa-film"></i> ${t.movies}`;
        document.getElementById('link-documentaries').innerHTML = `<i class="fa-solid fa-globe"></i> ${t.documentaries}`;
        document.getElementById('link-news').innerHTML = `<i class="fa-solid fa-newspaper"></i> ${t.news}`;
        document.getElementById('link-sports').innerHTML = `<i class="fa-solid fa-trophy"></i> ${t.sports}`;
        document.getElementById('link-favorites').innerHTML = `<i class="fa-solid fa-heart"></i> ${t.favorites}`;
        
        document.getElementById('title-countries').innerText = t.filterCountry;
        document.getElementById('title-languages').innerText = t.filterLanguage;
        
        searchInput.placeholder = t.searchPlaceholder;
        viewModeToggle.title = t.changeView;
        closePlayerModal.title = t.closePlayer;
        modalFavBtn.title = t.addFav;

        document.getElementById('empty-state').innerHTML = `
            <i class="fa-solid fa-tv"></i>
            <h3>${t.noChannels}</h3>
            <p>${t.noChannelsDesc}</p>
        `;

        playerError.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${t.channelError}</p>
        `;
    }

    // 1. Fetch channels data
    async function loadChannels() {
        try {
            localizeUI();
            const response = await fetch('channels_with_streams.json');
            allChannels = await response.json();
            filteredChannels = [...allChannels];
            
            // Extract countries and languages dynamically
            populateFilters();
            renderChannels();
            setupSidebarNavigation();
        } catch (error) {
            console.error('Error cargando canales:', error);
            channelsGrid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>${t.errorLoading}</h3><p>${t.errorLoadingDesc}</p></div>`;
        }
    }

    // 2. Extract countries/languages and populate sidebar
    function populateFilters() {
        const countries = new Set();
        const languages = new Set();

        allChannels.forEach(ch => {
            const name = ch.name.toLowerCase();
            const source = ch.source.toLowerCase();

            let language = 'Español';
            let country = 'espana'; // Default country fallback (normalized key)

            // Guess Language
            const isPortuguese = name.includes('portug') || name.includes('brasil') || name.includes('brazil') || name.includes('cnn portugal') || /\b(tvi|sic|rtp)\b/.test(name) || name.endsWith(' pt') || name.includes(' pt ') || name.includes('cultura rn') || name.includes('tv futuro');
            if (isPortuguese) {
                language = 'Portugués';
                country = (name.includes('brasil') || name.includes('brazil') || name.includes('cultura rn') || name.includes('tv futuro')) ? 'brasil' : 'portugal';
            } else if (name.includes('german') || name.includes('deutsch') || name.includes('telebarn') || name.includes('welle') || name.includes('fernsehen')) {
                language = 'Alemán';
                country = 'alemania';
            } else if (name.includes('francais') || name.includes('français') || name.includes('france 24') || name.includes('tv5') || name.includes('tv3 cat') || name.includes('canal 324')) {
                language = (name.includes('tv3') || name.includes('324')) ? 'Catalán' : 'Francés';
                country = language === 'Catalán' ? 'espana' : 'francia';
            } else if (name.includes('italiana') || name.includes('italiano') || name.includes('rai')) {
                language = 'Italiano';
                country = 'italia';
            } else if (name.includes('arabic') || name.includes('árabe') || name.includes('arabia') || (name.includes('al jazeera') && !name.includes('english')) || name.includes('al-mayadeen') || name.includes('qatar')) {
                language = 'Árabe';
                country = 'internacionales';
            } else if (name.includes('israel') || name.includes('hebrew') || name.includes('hebreo')) {
                language = 'Hebreo';
                country = 'internacionales';
            } else if (name.includes('iranian') || name.includes('farsi') || name.includes('persa') || name.includes('persian')) {
                language = 'Persa / Farsi';
                country = 'internacionales';
            } else if (name.includes('korean') || name.includes('coreano') || name.includes('sbs') || name.includes('kbs') || name.includes('ytn') || name.includes('mbc')) {
                language = 'Coreano';
                country = 'corea-del-sur';
            } else if (name.includes('cctv') || name.includes('cgtn english') || name.includes('ann news') || name.includes('ntv news') || name.includes('china')) {
                language = 'Chino / Asiático';
                country = 'china';
            } else if (name.includes('24 hour free') || name.includes('abn bible') || name.includes('wjbk') || name.includes('usa today') || name.includes('wxii') || name.includes('strongman') || name.includes('rally') || name.includes('oan') || name.includes('nhra') || name.includes('nbc') || name.includes('fite') || name.includes('fanduel') || name.includes('racing') || name.includes('dust') || name.includes('draftkings') || name.includes('bx') || name.includes('golf') || name.includes('bbc') || name.includes('wgrz') || name.includes('buffalo') || name.includes('pbs') || name.includes('antiques') || name.includes('earth') || name.includes('adventure') || name.includes('science') || name.includes('mystery') || name.includes('cinema') || name.includes('documentary') || name.includes('nature') || name.includes('history') || name.includes('english') || name.includes('news') || name.includes('weather') || name.includes('bloomberg') || name.includes('cnbc') || name.includes('world') || name.includes('nasa') || name.includes('shark') || name.includes('cbs') || name.includes('fox') || name.includes('reuters') || name.includes('press tv') || name.includes('arirang') || name.includes('sky')) {
                if (name.includes('espanol') || name.includes('español') || name.includes('latino') || name.includes('hechos') || name.includes('telediario')) {
                    language = 'Español';
                } else {
                    language = 'Inglés';
                    country = 'internacionales';
                }
            } else if (source.includes('estados-unidos')) {
                if (name.includes('espanol') || name.includes('español') || name.includes('latino') || name.includes('hechos') || name.includes('telediario') || name.includes('deportes')) {
                    language = 'Español';
                } else {
                    language = 'Inglés';
                }
            } else if (source.includes('espanol') || source.includes('tdt-online')) {
                language = 'Español';
            }

            // Guess Country (only override if it's currently España and it is actually Spanish language)
            if (language === 'Español') {
                if (name.includes('canal de historia')) {
                    country = 'internacionales';
                } else if (name.includes('paraguay')) {
                    country = 'paraguay';
                } else if (source.includes('argentina') || name.includes('argentina') || name.includes(' c5n') || name.includes(' tn ') || name.includes('telemax') || name.includes('tandil') || name.includes('buenos aires')) {
                    country = 'argentina';
                } else if (source.includes('venezuela') || name.includes('venezuela') || name.includes('venevision') || name.includes('televen') || name.includes('anzoategui') || name.includes('aragua')) {
                    country = 'venezuela';
                } else if (source.includes('colombia') || name.includes('colombia') || name.includes('caracol') || name.includes('capital') || name.includes('antioquia') || name.includes('telemedellin')) {
                    country = 'colombia';
                } else if (source.includes('mexico') || name.includes('méxico') || name.includes('mexico') || name.includes('ortvweb') || name.includes('azteca') || name.includes('milenio') || name.includes('telediario') || name.includes('multimedios') || name.includes('estrellas') || name.includes('formula') || name.includes('heraldo')) {
                    country = 'mexico';
                } else if (source.includes('peru') || name.includes('perú') || name.includes('peru') || name.includes('willax') || name.includes('latina') || name.includes('exitosa') || name.includes('pbo') || name.includes('panamericana') || name.includes('atv') || name.includes('karibeña')) {
                    country = 'peru';
                } else if (source.includes('chile') || name.includes('chile') || name.includes('chilevisión') || name.includes('crtv') || name.includes('energeek') || name.includes('t13')) {
                    country = 'chile';
                } else if (source.includes('cuba') || name.includes('cuba') || name.includes('cubavisión') || name.includes('prensa latina')) {
                    country = 'cuba';
                } else if (source.includes('uruguay') || name.includes('uruguay') || name.includes('valle nuevo')) {
                    country = 'uruguay';
                } else if (source.includes('ecuador') || name.includes('ecuador') || name.includes('hechos')) {
                    country = 'ecuador';
                } else if (source.includes('honduras') || name.includes('honduras') || name.includes('hch') || name.includes('une tv')) {
                    country = 'honduras';
                } else if (source.includes('costa-rica') || name.includes('costa rica')) {
                    country = 'costa-rica';
                } else if (source.includes('puerto-rico') || name.includes('puerto rico') || name.includes('wapa')) {
                    country = 'puerto-rico';
                } else {
                    country = 'espana';
                }
            }
            if (source.includes('estados-unidos')) {
                country = 'estados-unidos';
            }

            // Filter only Spanish-speaking countries and USA, map others to "Internacionales"
            const allowedCountries = new Set([
                'argentina', 'bolivia', 'chile', 'colombia', 'costa-rica', 'cuba', 
                'ecuador', 'el-salvador', 'espana', 'estados-unidos', 'guatemala', 
                'honduras', 'mexico', 'nicaragua', 'panama', 'paraguay', 'peru', 
                'puerto-rico', 'republica-dominicana', 'uruguay', 'venezuela'
            ]);
            if (!allowedCountries.has(country)) {
                country = 'internacionales';
            }

            // Add back to items
            ch.country = country;
            ch.language = language;

            countries.add(country);
            languages.add(language);
        });

        // Populate countries list in sidebar
        countriesList.innerHTML = '';
        Array.from(countries).sort().forEach(countryKey => {
            const li = document.createElement('li');
            const displayName = countryNames[countryKey] || countryKey;
            li.innerHTML = `<a href="#" data-tab="country:${countryKey}"><i class="fa-solid fa-map-pin"></i> ${displayName}</a>`;
            countriesList.appendChild(li);
        });

        // Populate languages list in sidebar
        languagesList.innerHTML = '';
        Array.from(languages).sort().forEach(lang => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-tab="lang:${lang}"><i class="fa-solid fa-language"></i> ${lang}</a>`;
            languagesList.appendChild(li);
        });
    }

    // 3. Render Channels to Grid
    function renderChannels() {
        channelsGrid.innerHTML = '';
        
        if (filteredChannels.length === 0) {
            emptyState.style.display = 'flex';
            channelsGrid.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        channelsGrid.style.display = viewMode === 'grid' ? 'grid' : 'block';
        if (viewMode === 'list') {
            channelsGrid.classList.add('list-mode');
        } else {
            channelsGrid.classList.remove('list-mode');
        }

        filteredChannels.forEach(ch => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.setAttribute('tabindex', '0'); // Essential for Android TV / D-Pad focus navigation

            const isFav = favorites.some(fav => fav.page_url === ch.page_url);
            const logoPath = ch.local_logo ? ch.local_logo : ch.logo;

            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" aria-label="Favorito">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <div class="card-logo-container">
                    <img class="card-logo" src="${logoPath || 'logos/default.png'}" alt="${ch.name}" loading="lazy">
                </div>
                <div class="card-title" title="${ch.name}">${ch.name}</div>
                <div class="card-source">${ch.language}</div>
            `;

            // Robust Image Fallback Handler (local -> remote -> placeholder)
            const cardImg = card.querySelector('.card-logo');
            cardImg.onerror = () => {
                if (ch.local_logo && ch.logo && !cardImg.src.includes(ch.logo)) {
                    cardImg.src = ch.logo;
                } else {
                    cardImg.src = 'https://placehold.co/120x120/1a1a24/ffffff?text=TV';
                }
            };

            // Card Click Handler
            card.addEventListener('click', (e) => {
                if (e.target.closest('.fav-btn')) {
                    e.stopPropagation();
                    toggleFavorite(ch, card.querySelector('.fav-btn'));
                } else {
                    openPlayer(ch);
                }
            });

            // Card Keydown Handler for Enter key
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    openPlayer(ch);
                }
            });

            channelsGrid.appendChild(card);
        });
    }

    // 4. Sidebar click navigation
    function setupSidebarNavigation() {
        const allLinks = document.querySelectorAll('.sidebar a');
        allLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Set active class
                allLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                currentTab = link.getAttribute('data-tab');
                applyFiltersAndSearch();
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;

                // On mobile, close sidebar automatically on selection
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // 5. Apply filters & Search
    function applyFiltersAndSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        // Filter by Tab/Category/Country/Language
        let tabFiltered = [];
        if (currentTab === 'all') {
            tabFiltered = [...allChannels];
            categoryTitle.innerText = t.allChannels;
            categoryDesc.innerText = t.allChannelsDesc;
        } else if (currentTab === 'movies') {
            const movieKeywords = ['cine', 'film', 'movie', 'pelicula', 'runtime', 'retro', 'western', 'onegai', 'cartoon', 'showcase'];
            tabFiltered = allChannels.filter(ch => {
                const name = ch.name.toLowerCase();
                const source = ch.source.toLowerCase();
                return movieKeywords.some(kw => name.includes(kw) || source.includes(kw));
            });
            categoryTitle.innerText = t.movies;
            categoryDesc.innerText = t.moviesDesc;
        } else if (currentTab === 'documentaries') {
            const docKeywords = ['doc', 'weather', 'nasa', 'earth', 'science', 'discovery', 'historia', 'encuentro', 'cultura', 'viajar', 'viajes', 'nature', 'geo', 'wild', 'garage'];
            tabFiltered = allChannels.filter(ch => {
                const name = ch.name.toLowerCase();
                const source = ch.source.toLowerCase();
                return docKeywords.some(kw => name.includes(kw) || source.includes(kw));
            });
            tabFiltered.sort((a, b) => {
                if (a.name === 'Canal de Historia') return -1;
                if (b.name === 'Canal de Historia') return 1;
                return 0;
            });
            categoryTitle.innerText = t.documentaries;
            categoryDesc.innerText = t.documentariesDesc;
        } else if (currentTab === 'news') {
            const newsKeywords = ['news', 'noticias', 'info', 'journal', 'press', 'prensa', 'report', 'alerte', 'alerta', 'tve - 24h', 'a24', 'c5n', 'tn', 'milenio', 'telediario', 'canal 26', 'hch', 'marti', 'martí'];
            tabFiltered = allChannels.filter(ch => {
                const name = ch.name.toLowerCase();
                const source = ch.source.toLowerCase();
                return newsKeywords.some(kw => name.includes(kw) || source.includes(kw));
            });
            categoryTitle.innerText = t.news;
            categoryDesc.innerText = t.newsDesc;
        } else if (currentTab === 'sports') {
            const sportsKeywords = ['sport', 'deporte', 'futbol', 'fútbol', 'trophy', 'stadium', 'arena', 'championship', 'racing', 'golf', 'tennis', 'tenis', 'motor', 'fight', 'combate', 'mma', 'wwe', 'ufc', 'billiard', 'espn', 'tyc', 'bein', 'laliga', 'real madrid', 'barça', 'olympic', 'olimpico'];
            tabFiltered = allChannels.filter(ch => {
                const name = ch.name.toLowerCase();
                const source = ch.source.toLowerCase();
                return sportsKeywords.some(kw => name.includes(kw) || source.includes(kw));
            });
            categoryTitle.innerText = t.sports;
            categoryDesc.innerText = t.sportsDesc;
        } else if (currentTab === 'favorites') {
            tabFiltered = [...favorites];
            categoryTitle.innerText = t.favorites;
            categoryDesc.innerText = t.favoritesDesc;
        } else if (currentTab.startsWith('country:')) {
            const countryKey = currentTab.replace('country:', '');
            tabFiltered = allChannels.filter(ch => ch.country === countryKey);
            const countryName = countryNames[countryKey] || countryKey;
            categoryTitle.innerText = currentLang === 'en' ? `Channels from ${countryName}` : `Canales de ${countryName}`;
            categoryDesc.innerText = t.countryDesc.replace('{name}', countryName);
        } else if (currentTab.startsWith('lang:')) {
            const lang = currentTab.replace('lang:', '');
            tabFiltered = allChannels.filter(ch => ch.language === lang);
            categoryTitle.innerText = currentLang === 'en' ? `Language: ${lang}` : `Idioma: ${lang}`;
            categoryDesc.innerText = t.langDesc.replace('{name}', lang);
        }

        // Apply Search Query
        if (query) {
            filteredChannels = tabFiltered.filter(ch => ch.name.toLowerCase().includes(query));
        } else {
            filteredChannels = tabFiltered;
        }

        renderChannels();
    }

    // 6. Handle Search input changes
    searchInput.addEventListener('input', applyFiltersAndSearch);

    // 7. View Mode toggle (Grid / List)
    viewModeToggle.addEventListener('click', () => {
        viewMode = viewMode === 'grid' ? 'list' : 'grid';
        localStorage.setItem('iptv_view_mode', viewMode);
        
        const icon = viewModeToggle.querySelector('i');
        if (viewMode === 'grid') {
            icon.className = 'fa-solid fa-grip';
        } else {
            icon.className = 'fa-solid fa-list';
        }

        renderChannels();
    });

    // 8. Toggle Favorites
    function toggleFavorite(ch, btn) {
        const index = favorites.findIndex(fav => fav.page_url === ch.page_url);
        if (index === -1) {
            favorites.push(ch);
            btn.classList.add('active');
            btn.querySelector('i').className = 'fa-solid fa-heart';
        } else {
            favorites.splice(index, 1);
            btn.classList.remove('active');
            btn.querySelector('i').className = 'fa-regular fa-heart';
        }
        localStorage.setItem('iptv_favorites', JSON.stringify(favorites));

        // If we are currently in favorites tab, re-render automatically
        if (currentTab === 'favorites') {
            applyFiltersAndSearch();
        }
    }

    // 9. Open/Close Player Modal
    function openPlayer(ch) {
        modalChannelTitle.innerText = ch.name;
        modalChannelLogo.src = ch.local_logo ? ch.local_logo : ch.logo;
        modalChannelLogo.onerror = () => {
            if (ch.local_logo && ch.logo && !modalChannelLogo.src.includes(ch.logo)) {
                modalChannelLogo.src = ch.logo;
            } else {
                modalChannelLogo.src = 'https://placehold.co/120x120/1a1a24/ffffff?text=TV';
            }
        };
        
        // Favorite state in Modal
        const isFav = favorites.some(fav => fav.page_url === ch.page_url);
        if (isFav) {
            modalFavBtn.classList.add('active');
            modalFavBtn.querySelector('i').className = 'fa-solid fa-heart';
        } else {
            modalFavBtn.classList.remove('active');
            modalFavBtn.querySelector('i').className = 'fa-regular fa-heart';
        }

        // Fav Button handler in Modal
        modalFavBtn.onclick = () => {
            toggleFavorite(ch, modalFavBtn);
        };

        // Open Modal
        playerModal.classList.add('active');
        playerError.style.display = 'none';

        // Play stream URL (.m3u8 HLS stream)
        const streamUrl = ch.stream_url;
        
        if (Hls.isSupported()) {
            if (hlsPlayer) {
                hlsPlayer.destroy();
            }
            hlsPlayer = new Hls({
                maxMaxBufferLength: 10,
                enableWorker: true
            });
            hlsPlayer.loadSource(streamUrl);
            hlsPlayer.attachMedia(videoPlayer);
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play().catch(() => {});
            });
            hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    playerError.style.display = 'flex';
                }
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // Fallback for Safari / Native iOS support
            videoPlayer.src = streamUrl;
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.play().catch(() => {});
            });
            videoPlayer.addEventListener('error', () => {
                playerError.style.display = 'flex';
            });
        } else {
            // General player error if HLS is not supported at all
            playerError.style.display = 'flex';
        }
    }

    function closePlayer() {
        playerModal.classList.remove('active');
        videoPlayer.pause();
        videoPlayer.src = '';
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
    }

    closePlayerModal.addEventListener('click', closePlayer);
    
    // Close modal on click outside content
    playerModal.addEventListener('click', (e) => {
        if (e.target === playerModal) {
            closePlayer();
        }
    });

    // 10. Sidebar responsive toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // 11. D-Pad Keyboard navigation (Android TV / PC D-pad simulation)
    document.addEventListener('keydown', (e) => {
        // Close modal on Escape
        if (e.key === 'Escape' && playerModal.classList.contains('active')) {
            closePlayer();
            return;
        }

        // If modal is active, let video controls handle keys or override for D-Pad
        if (playerModal.classList.contains('active')) {
            return;
        }

        const activeElement = document.activeElement;
        if (!activeElement || !activeElement.classList.contains('channel-card')) {
            // If nothing in grid is focused, pressing any arrow will focus the first channel
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                const firstCard = channelsGrid.querySelector('.channel-card');
                if (firstCard) {
                    firstCard.focus();
                    e.preventDefault();
                }
            }
            return;
        }

        const cards = Array.from(channelsGrid.querySelectorAll('.channel-card'));
        const index = cards.indexOf(activeElement);
        if (index === -1) return;

        // Calculate layout columns dynamically
        const cardStyle = window.getComputedStyle(activeElement);
        const cardWidth = activeElement.offsetWidth + parseFloat(cardStyle.marginRight || 0);
        const containerWidth = channelsGrid.offsetWidth;
        const columns = Math.max(1, Math.floor(containerWidth / cardWidth)) || 4;

        let targetIndex = -1;

        if (e.key === 'ArrowRight') {
            targetIndex = index + 1;
        } else if (e.key === 'ArrowLeft') {
            targetIndex = index - 1;
        } else if (e.key === 'ArrowDown') {
            targetIndex = index + columns;
        } else if (e.key === 'ArrowUp') {
            targetIndex = index - columns;
        }

        if (targetIndex >= 0 && targetIndex < cards.length) {
            cards[targetIndex].focus();
            e.preventDefault();
        }
    });

    // 12. Exit application button handler
    const exitBtn = document.getElementById('exit-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            if (window.Android && window.Android.exitApp) {
                window.Android.exitApp();
            } else {
                window.close();
            }
        });
    }

    // Run loader
    loadChannels();
});

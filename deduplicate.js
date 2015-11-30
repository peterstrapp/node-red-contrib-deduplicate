module.exports = function(RED) {
    function DeDuplicate(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.expiry = config.expiry;
        var node = this;

				if (!RED.settings.functionGlobalContext.hasOwnProperty('cache')) {
					RED.settings.functionGlobalContext.cache = [];
				}

				function createCacheEntry(key, expiry) {
					var cacheEntry = {};
					cacheEntry.expiry = expiry;
					cacheEntry.key = key;
					return cacheEntry;
				}

				function addToCache(cacheName, cacheEntry) {
					RED.settings.functionGlobalContext.cache[cacheName].push(cacheEntry);
				}

				function removeFromCache(cacheName, index) {
					RED.settings.functionGlobalContext.cache[cacheName].splice(index, 1);
				}

				function initializeCache(cacheName) {
					RED.settings.functionGlobalContext.cache[cacheName] = [];
				}

				function cacheContains(cacheName, key, cache)
				{
					for(i=0;i<cache.length;i++) {
						if(cache[i].key == key) {
							if(expired(cache[i])) {
								console.log('Entry expired, removing from cache.');
								removeFromCache(cacheName, i);
								return false;
							}
							return true;
						}
					}
					return false;
				}

				function expired(cacheEntry) {
					return new Date().getTime() > cacheEntry.expiry;
				}

        this.on('input', function(msg) {
          var cacheName = node.name;
					var cacheExpiry = node.expiry;

					if(typeof(RED.settings.functionGlobalContext.cache[cacheName]) !== 'undefined') {
						console.log(RED.settings.functionGlobalContext.cache);
						if(cacheContains(cacheName, JSON.stringify(msg.payload), RED.settings.functionGlobalContext.cache[cacheName])) {
							console.log('Duplicate message (ignored): ' + RED.settings.functionGlobalContext.cache[cacheName]);
							return null;
						} else {
							console.log('Adding to cache');
							addToCache(cacheName, createCacheEntry(JSON.stringify(msg.payload), new Date().getTime() + cacheExpiry*1000));
						}
					} else {
						initializeCache(cacheName);
						addToCache(cacheName, createCacheEntry(JSON.stringify(msg.payload), new Date().getTime() + cacheExpiry*1000));
					}

					node.send(msg);
        });
    }
    RED.nodes.registerType("deduplicate", DeDuplicate);
}
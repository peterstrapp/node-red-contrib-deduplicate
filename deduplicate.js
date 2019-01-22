"use strict";
module.exports = function (RED) {
    function DeDuplicate(config) {
        RED.nodes.createNode(this, config);
        this.expiry = config.expiry;
        this.keyproperty = config.keyproperty;
        this.storage = (config.noderole != 'standalone' ? this.context().global : this.context())
        this.registry = "DeDuplicate_" + (config.registryclass||'')

        var node = this;

        function expired(entry) {
            return new Date().getTime() > entry.expiry;
        }

		function cacheClean() {
			var data_changed=false;
			var i;
			var known_entries = node.storage.get(node.registry);
			
			Object.keys(known_entries).forEach(key => {
				//console.log(key, known_entries[key])
				for (i = 0; i < known_entries[key].length; i += 1) {
					//console.log(known_entries[key][i].expiry)
					if (expired(known_entries[key][i])) { 
						known_entries[key].splice(i, 1);
						data_changed=true;
					}
				}
				// if key is empty, rem
				if (known_entries[key].length==0) { 
					delete known_entries[key];
					data_changed=true;
				}
			});
			
			if (data_changed) node.storage.set(node.registry,known_entries)
			
		}
        function cacheContains(topic,key,expiry_lifetime) {
            var i;
            var known_entries;

            known_entries = node.storage.get(node.registry+'["'+topic+'"]')

            for (i = 0; i < known_entries.length; i += 1) {
                if (known_entries[i].key === key) {
                    if (!expired(known_entries[i])) {							
						if (config.expirypolicy=='extend') {
							known_entries[i].expiry=new Date().getTime() + expiry_lifetime * 1000;
							node.storage.set(node.registry+'["'+topic+'"]',known_entries)							
						}
                        return true;
                    }
                    known_entries.splice(i, 1);
                    node.storage.set(node.registry+'["'+topic+'"]',known_entries)
                }
            }
            return false;
        }

        this.on('input', function (msg) {


            var key = node.keyproperty ? msg.payload[node.keyproperty] : msg.payload;
            var topic = (msg.topic || "default_topic")
			var expiry_lifetime = (isNaN(parseInt(node.expiry)) ? null : parseInt(node.expiry))  || (isNaN(parseInt(msg[node.expiry])) ? null : parseInt(msg[node.expiry])) || 5

            if (node.storage.get(node.registry) === undefined) {
                node.storage.set(node.registry,{})
            }

            if (node.storage.get(node.registry+'["'+topic+'"]') === undefined) {
                node.storage.set(node.registry+'["'+topic+'"]',[])
            }


            if (cacheContains(topic, JSON.stringify(key),expiry_lifetime)) {
                node.send([null, msg]);
                return;
            }

            var known_values  = node.storage.get(node.registry+'["'+topic+'"]')

            if (config.noderole != "deduplicate") {
                known_values.push({expiry: new Date().getTime() + expiry_lifetime * 1000, key: JSON.stringify(key)});
                node.storage.set(node.registry+'["'+topic+'"]',known_values)
            }
			
			
			// Clean from time to time
			if (Math.floor(Math.random() * 3)==1) cacheClean()

            node.send([msg, null]);
        });
    }
    RED.nodes.registerType("deduplicate", DeDuplicate);
};

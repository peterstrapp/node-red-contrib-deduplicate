"use strict";
module.exports = function (RED) {
    function DeDuplicate(config) {
        RED.nodes.createNode(this, config);
        this.expiry = config.expiry;
        this.keyproperty = config.keyproperty;
        var node = this;

        function expired(entry) {
            return new Date().getTime() > entry.expiry;
        }

        function cacheContains(key) {
            var i;
            for (i = 0; i < node.cache.length; i += 1) {
                if (node.cache[i].key === key) {
                    if (!expired(node.cache[i])) {
                        return true;
                    }
                    node.cache.splice(i, 1);
                }
            }
            return false;
        }

        this.on('input', function (msg) {
            if (node.cache === undefined) {
                node.cache = [];
            }

            var key = node.keyproperty ? msg.payload[node.keyproperty] : msg.payload;
            if (cacheContains(JSON.stringify(key))) {
                node.send([null, msg]);
                return;
            }

            node.cache.push({expiry: new Date().getTime() + node.expiry * 1000, key: JSON.stringify(key)});
            node.send([msg, null]);
        });
    }
    RED.nodes.registerType("deduplicate", DeDuplicate);
};
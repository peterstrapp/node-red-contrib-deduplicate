node-red-contrib-deduplicate
============================
Node-RED node that filters duplicate messages. First output will return non-duplicated values, second one will output duplicated.

Analysis will be done grouped by topic if defined.
By default payload value is considered for analysis - specific key can be specified in "Msg Key Property".

Node role may be:
* **Add+Deduplicate within node:** analysis within given inputs of node
* **Registry class:** Allow addition or analysis upon a centrally managed list of values, cross nodes and based on the defined registry name

![Example](example.png)

/**
 * @polymerBehavior Polymer.BJSRealtimeDbMsgHandler
 */
Polymer.BJSRealtimeDbMsgHandler = {
  properties: {

  },

  __handleRxEvent: function(ev, authUser) {
    this.__silly('__handleRxEvent', authUser, ev.detail);
    let type = ev.detail.type;
    if (type !== 'db-activity') {
      return;
    }
    let payload = ev.detail.payload;

    if (authUser.id !== payload.user) {
      this.__parsePayload(payload);
    }
  },

  __parsePayload: function(payload) {
    if (payload.response) {
      payload.response.__readonly__ = true;
    }
    
    let pathSpec = payload.pathSpec.split('/').map(ps => Sugar.String.camelize(ps, false));
    let path = payload.path.split('/').map(p => Sugar.String.camelize(p, false));
    let paramsRegex = /:(([a-z]|[A-Z]|[0-9]|[\-])+)(?:\(.*?\))?$/;

    let params = {};
    for (let idx=0; idx<path.length; idx++) {
      let pathParamMatches = pathSpec[idx].match(paramsRegex);
      if (pathParamMatches && pathParamMatches[1]) {
        params[pathParamMatches[1]] = path[idx];
      }
    }
    this.__silly(path);
    this.__silly(pathSpec);
    this.__silly(params);

    switch (payload.verb) {
      case 'post': {
        if (payload.path.includes('metadata') && params.id && params.key) {
          this.__handleMetadataPost(path, params, payload);
        } else {
          this.__handlePostCommon(path, params, payload);
        }

      } break;
      case 'put': {
        for (let x=0; x<payload.response.length; x++) {
          this.__handlePut(path, params, payload, payload.response[x]);
        }
      } break;
      case 'delete': {
        if (path.length === 2 && params.id) {
          let data = this.get(['db', path[0], 'data']);
          let itemIndex = data.findIndex(d => d.id === params.id);
          if (itemIndex !== -1) {
            let item = data[itemIndex];
            item.__readonly__ = true;
            this.splice(['db',path[0],'data'], itemIndex, 1);
          }
        }
      } break;
    }
  },

  __handleMetadataPost: function(path, params, payload) {
    this.__silly('__handleMetadataPost', path[0], params, payload.response.value);
    let metadata = this.get(['db', path[0], 'metadata', params.id]);
    let metadataRoot = this.get(['db', path[0], 'metadata']);

    if (!metadata) {
      this.__warn('ignoring metadata update, not already loaded');
      return;
    }
    this.__silly('metadata', metadata);

    metadataRoot.__readOnlyChange__ = true;
    this.set(['db', path[0], 'metadata', params.id, params.key], payload.response.value);
  },


  __handlePostCommon: function(path, params, payload) {
    if (path.length !== 1) {
      return;
    }
    this.push(['db', path[0], 'data'], payload.response);
  },

  __getUpdatePath: function(path, params, payload, response) {
    if (path.length !== 2) {
      return false;
    }

    let data = this.get(['db', path[0], 'data']);
    if (!data) {
      return false;
    }

    let entityIdx = data.findIndex(e => e.id === path[1]);
    if (entityIdx === -1) {
      return false;
    }

    return ['db', path[0], 'data', entityIdx, response.path];
  },

  __handlePut: function(path, params, payload, response) {
    let updatePath = this.__getUpdatePath(path, params, payload, response);
    if (updatePath === false) {
      this.__warn(`__handlePut Invalid Update: `, path);
      return;
    }
    this.__silly(`__handlePut`, path, updatePath);

    this.db[path[0]].data[updatePath[3]].__readOnlyChange__ = true;
    switch (response.type) {
      case 'scalar': {
        this.__silly('updating', updatePath, response.value);
        this.set(updatePath, response.value);
        break;
      }
      case 'vector-add': {
        this.__silly('inserting', updatePath, response.value);
        this.push(updatePath, response.value);
        break;
      }
      case 'vector-rm': {
        this.__silly('removing', updatePath, response.value);
        this.splice(updatePath, response.value.index, response.value.numRemoved);
        break;
      }
    }
  }
};

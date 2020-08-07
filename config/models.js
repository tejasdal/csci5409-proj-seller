module.exports.models = {
  migrate: 'safe',

  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true, },
    updatedAt: { type: 'number', autoUpdatedAt: true, },
    id: { type: 'number', autoIncrement: true, },
  },

  dataEncryptionKeys: {
    default: 'Bewsu2IRvvyTgOxx9ZeVxMWQmwBo9UZE5Fsw8/YDUUE='
  },

  cascadeOnDestroy: true,


};

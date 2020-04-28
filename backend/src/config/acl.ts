// Posession for now dont implemented so there are any rules for each resource group
export default {
  // TODO: Define a list of endpoints needs to be accessible by administrator on a client side
  // Currently administrator does not inherit user rules since this will affect controllers functionality
  administrator: {
    // There are some modifications required to creator and employer endpoints since they are rely on current user
    // And in case of staff is logged in there will be an error due to missing id and invalid type
    creator: {
      'read:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
    creatorFeatured: {
      'create:any': ['*'],
    },
    creatorUnFeatured: {
      'delete:any': ['*'],
    },
    creatorBulkVerify: {
      'create:any': ['*'],
    },
    creatorPatch: {
      'update:any': ['*'],
    },
    banCreator: {
      'create:any': ['*'],
      'delete:any': ['*'],
    },

    project: {
      'read:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },

    getAllJobs: {
      'read:any': ['*'],
    },

    employer: {
      'read:any': ['*'],
      'delete:any': ['*'],
      'create:any': ['*'],
    },
    employerFeatured: {
      'create:any': ['*'],
    },
    employerUnFeatured: {
      'delete:any': ['*'],
    },
    banEmployer: {
      'create:any': ['*'],
      'delete:any': ['*'],
    },
    employerCreate: {
      'create:any': ['*'],
    },
    employerList: {
      'read:any': ['*'],
    },
    employerProfile: {
      'update:any': ['*'],
    },
    employerVerify: {
      'create:any': ['*'],
    },
    employerPatch: {
      'update:any': ['*'],
    },

    job: {
      'create:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },

    createAnnouncement: {
      'create:any': ['*'],
    },
    deleteAnnouncement: {
      'delete:any': ['*'],
    },

    feed: {
      'read:any': ['*'],
    },

    staff: {
      'create:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },

    invite: {
      'read:any': ['*'],
      'create:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
    createInviteCode: {
      'create:any': ['*'],
    },
    media: {
      'read:any': ['*'],
    },
  },

  moderator: {
    index: {
      'read:any': ['*'],
    },
    auth: {
      'create:any': ['*'],
    },
    staff: {
      'read:any': ['*'],
      'update:any': ['*'],
    },
    creatorVerify: {
      'create:any': ['*'],
    },
    creatorBeta: {
      'create:any': ['*'],
      'delete:any': ['*'],
    },
  },

  // By default both creator and employer will inherit user permissions
  // In case we'll get a requirement to restrict something for one of them we'll need to just modify access rules for
  // a specific type
  creator: {
    project: {
      'create:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
    creatorProfile: {
      'update:own': ['*'],
    },
    jobapplication: {
      'create:any': ['*'],
      'delete:any': ['*'], // Posession check is implemented on controller level
    },
    subscription: {
      'read:any': ['*'],
      'create:any': ['*'],
      'update:any': ['*'], // Posession check is implemented on controller level
      'delete:any': ['*'], // Posession check is implemented on controller level
    },
    creatorVerify: {
      'create:own': ['*'],
    },
    creator: {
      'create:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
  },
  employer: {
    job: {
      'create:any': ['*'],
      'update:any': ['*'],
      'delete:any': ['*'],
    },
    employerProfile: {
      'update:own': ['*'],
    },
    employer: {
      'create:any': ['*'],
      'update:any': ['*'],
    },
    hireMark: {
      'create:any': ['*'],
      'delete:any': ['*'],
    },
  },

  user: {
    index: {
      'read:any': ['*'],
    },
    auth: {
      'create:any': ['*'],
    },
    account: {
      'read:any': ['*'],
      'create:any': ['*'],
    },
    brand: {
      'read:any': ['*'],
    },
    creator: {
      'read:any': ['*'],
    },
    creatorListFeatured: {
      'read:any': ['*'],
    },
    employer: {
      'read:any': ['*'],
    },
    employerListFeatured: {
      'read:any': ['*'],
    },
    job: {
      'read:any': ['*'],
    },
    jobapplication: {
      'read:any': ['*'],
    },
    tag: {
      'read:any': ['*'],
    },
    feedback: {
      'create:any': ['*'],
    },
    feed: {
      'read:any': ['*'],
    },
    media: {
      'read:any': ['*'],
    },
    project: {
      'read:any': ['*'],
    },
  },
};

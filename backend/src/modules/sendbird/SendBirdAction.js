import * as SendBird from 'sendbird';
import {
  isNull
} from '../../utils/misc';
import * as SendbirdApi from '../../utils/SendbirdApi';

let instance = null;

class SendBirdAction {
  constructor() {
    if (instance) {
      return instance;
    }
    const appId = process.env.SENDBIRD_APP_ID;

    this.sb = new SendBird({
      appId
    });

    this.userQuery = null;
    this.openChannelQuery = null;
    this.groupChannelQuery = null;
    this.previousMessageQuery = null;
    this.participantQuery = null;
    this.blockedQuery = null;
    instance = this;
  }

  /**
   * Connect
   */
  connect(userId, nickname, photo) {
    return new Promise((resolve, reject) => {
      const sb = SendBird.getInstance();
      sb.connect(
        userId,
        (user, error) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            sb.updateCurrentUserInfo(decodeURIComponent(nickname), photo, (user, error) => {
              error ? reject(error) : resolve(user);
            });
          }
        }
      );
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      this.sb.disconnect((response, error) => {
        console.log('error => ', error);
        error ? reject(error) : resolve();
      });
    });
  }

  /**
   * Set auto accept flag
   * @param {boolean} autoAccept set whether auto accept invitation or not
   */
  setAutoAccept(autoAccept) {
    return new Promise((resolve, reject) => {
      this.sb.setChannelInvitationPreference(autoAccept, function (response, error) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Create metadata for current user
   * @param {string} name user name
   * @param {string} titles user titles
   */
  createMetaData(name, titles) {
    return new Promise((resolve, reject) => {
      var data = {
        "metadata": {
          "name": decodeURIComponent(name),
          "titles": titles
        },
        "upsert": true
      };

      var user = this.getCurrentUser();
      const url = '/users/' + encodeURIComponent(user.userId) + '/metadata';
      console.log(url, ' : data => ', data);
      SendbirdApi.put(url, data)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          console.log('url : ', url, ' error : ', error.response.data);
          reject(error);
        });

      // SendbirdApi.get(url)
      //   .then((response) => {
      //     console.log(response);
      //     resolve(response);
      //   })
      //   .catch((error) => {
      //     console.log('url : ', url, ' error : ', error.response.data);
      //     reject(error);
      //   });

      // user.createMetaData(data, function (metadata, error) {
      //   error ? reject(error) : resolve(metadata);
      // });

      // user.createMetaData(data, function (metadata, error) {
      //   console.log('createMetaData error ', error);
      //   error ? reject(error) : resolve(metadata);
      // });
    });
  }

  /**
   * User
   */
  getCurrentUser() {
    return this.sb.currentUser;
  }

  getUserList(isInit = false) {
    if (isInit || isNull(this.userQuery)) {
      // this.userQuery = new this.sb.createApplicationUserListQuery();
      this.userQuery = this.sb.createApplicationUserListQuery();
      this.userQuery.limit = 30;
    }
    return new Promise((resolve, reject) => {
      if (this.userQuery.hasNext && !this.userQuery.isLoading) {
        this.userQuery.next((list, error) => {
          error ? reject(error) : resolve(list);
        });
      } else {
        resolve([]);
      }
    });
  }

  searchPartnersByName(filter) {
    this.userQuery = this.sb.createApplicationUserListQuery();
    this.userQuery.metaDataKeyFilter = 'name';
    this.userQuery.metaDataValuesFilter = [filter];
    this.userQuery.limit = 50;

    return new Promise((resolve, reject) => {
      if (this.userQuery.hasNext && !this.userQuery.isLoading) {
        this.userQuery.next((list, error) => {
          error ? reject(error) : resolve(list);
        });
      } else {
        resolve([]);
      }
    });
  }

  isCurrentUser(user) {
    return user.userId === this.sb.currentUser.userId;
  }

  getBlockedList(isInit = false) {
    if (isInit || isNull(this.blockedQuery)) {
      this.blockedQuery = this.sb.createBlockedUserListQuery();
      this.blockedQuery.limit = 30;
    }
    return new Promise((resolve, reject) => {
      if (this.blockedQuery.hasNext && !this.blockedQuery.isLoading) {
        this.blockedQuery.next((blockedList, error) => {
          error ? reject(error) : resolve(blockedList);
        });
      } else {
        resolve([]);
      }
    });
  }

  blockUser(user, isBlock = true) {
    return new Promise((resolve, reject) => {
      if (isBlock) {
        this.sb.blockUser(user, (response, error) => {
          error ? reject(error) : resolve();
        });
      } else {
        this.sb.unblockUser(user, (response, error) => {
          error ? reject(error) : resolve();
        });
      }
    });
  }

  /**
   * Channel
   */
  getChannel(channelUrl, isOpenChannel = true) {
    return new Promise((resolve, reject) => {
      if (isOpenChannel) {
        this.sb.OpenChannel.getChannel(channelUrl, (openChannel, error) => {
          error ? reject(error) : resolve(openChannel);
        });
      } else {
        this.sb.GroupChannel.getChannel(channelUrl, (groupChannel, error) => {
          error ? reject(error) : resolve(groupChannel);
        });
      }
    });
  }

  /**
   * Open Channel
   */
  getOpenChannelList(isInit = false, urlKeyword = '') {
    if (isInit || isNull(this.openChannelQuery)) {
      // this.openChannelQuery = new this.sb.OpenChannel.createOpenChannelListQuery();
      this.openChannelQuery = this.sb.OpenChannel.createOpenChannelListQuery();
      this.openChannelQuery.limit = 20;
      this.openChannelQuery.urlKeyword = urlKeyword;
    }
    return new Promise((resolve, reject) => {
      if (this.openChannelQuery.hasNext && !this.openChannelQuery.isLoading) {
        this.openChannelQuery.next((list, error) => {
          error ? reject(error) : resolve(list);
        });
      } else {
        resolve([]);
      }
    });
  }

  createOpenChannel(channelName) {
    return new Promise((resolve, reject) => {
      channelName
        ?
        this.sb.OpenChannel.createChannel(channelName, null, null, (openChannel, error) => {
          error ? reject(error) : resolve(openChannel);
        }) :
        this.sb.OpenChannel.createChannel((openChannel, error) => {
          error ? reject(error) : resolve(openChannel);
        });
    });
  }

  enter(channelUrl) {
    return new Promise((resolve, reject) => {
      this.sb.OpenChannel.getChannel(channelUrl, (openChannel, error) => {
        if (error) {
          reject(error);
        } else {
          openChannel.enter((response, error) => {
            error ? reject(error) : resolve();
          });
        }
      });
    });
  }

  exit(channelUrl) {
    return new Promise((resolve, reject) => {
      this.sb.OpenChannel.getChannel(channelUrl, (openChannel, error) => {
        if (error) {
          reject(error);
        } else {
          openChannel.exit((response, error) => {
            error ? reject(error) : resolve();
          });
        }
      });
    });
  }

  getParticipantList(channelUrl, isInit = false) {
    return new Promise((resolve, reject) => {
      this.sb.OpenChannel.getChannel(channelUrl, (openChannel, error) => {
        if (error) {
          reject(error);
        } else {
          if (isInit || isNull(this.participantQuery)) {
            this.participantQuery = openChannel.createParticipantListQuery();
            this.participantQuery.limit = 30;
          }
          if (this.participantQuery.hasNext && !this.participantQuery.isLoading) {
            this.participantQuery.next((participantList, error) => {
              error ? reject(error) : resolve(participantList);
            });
          } else {
            resolve([]);
          }
        }
      });
    });
  }

  /**
   * Group Channel
   */
  getGroupChannelList(isInit = false) {
    if (isInit || isNull(this.groupChannelQuery)) {
      // this.groupChannelQuery = new this.sb.GroupChannel.createMyGroupChannelListQuery();
      this.groupChannelQuery = this.sb.GroupChannel.createMyGroupChannelListQuery();
      this.groupChannelQuery.limit = 50;
      this.groupChannelQuery.includeEmpty = false;
      this.groupChannelQuery.order = 'latest_last_message';
    }
    return new Promise((resolve, reject) => {
      if (this.groupChannelQuery.hasNext && !this.groupChannelQuery.isLoading) {
        this.groupChannelQuery.next((list, error) => {
          error ? reject(error) : resolve(list);
        });
      } else {
        resolve([]);
      }
    });
  }

  createGroupChannel(userIds) {
    return new Promise((resolve, reject) => {
      let params = new(this.sb.GroupChannelParams)();
      params.addUserIds(userIds);
      this.sb.GroupChannel.createChannel(params, (groupChannel, error) => {
        error ? reject(error) : resolve(groupChannel);
      });
    });
  }

  inviteGroupChannel(channelUrl, userIds) {
    return new Promise((resolve, reject) => {
      this.sb.GroupChannel.getChannel(channelUrl, (groupChannel, error) => {
        if (error) {
          reject(error);
        } else {
          groupChannel.inviteWithUserIds(userIds, (groupChannel, error) => {
            error ? reject(error) : resolve(groupChannel);
          });
        }
      });
    });
  }

  leave(channelUrl) {
    return new Promise((resolve, reject) => {
      this.sb.GroupChannel.getChannel(channelUrl, (groupChannel, error) => {
        if (error) {
          reject(error);
        } else {
          groupChannel.leave((response, error) => {
            error ? reject(error) : resolve();
          });
        }
      });
    });
  }

  hide(channelUrl) {
    return new Promise((resolve, reject) => {
      this.sb.GroupChannel.getChannel(channelUrl, (groupChannel, error) => {
        if (error) {
          reject(error);
        } else {
          groupChannel.hide((response, error) => {
            error ? reject(error) : resolve();
          });
        }
      });
    });
  }

  markAsRead(channel) {
    channel.markAsRead();
  }

  /**
   * Message
   */
  getMessageList(channel, isInit = false) {
    if (isInit || isNull(this.previousMessageQuery)) {
      this.previousMessageQuery = channel.createPreviousMessageListQuery();
    }
    return new Promise((resolve, reject) => {
      if (this.previousMessageQuery.hasMore && !this.previousMessageQuery.isLoading) {
        this.previousMessageQuery.load(50, false, (messageList, error) => {
          error ? reject(error) : resolve(messageList);
        });
      } else {
        resolve([]);
      }
    });
  }

  getReadReceipt(channel, message) {
    if (this.isCurrentUser(message.sender)) {
      return channel.getReadReceipt(message);
    } else {
      return 0;
    }
  }

  sendUserMessage({
    channel,
    message,
    handler
  }) {
    return channel.sendUserMessage(message, (message, error) => {
      if (handler) handler(message, error);
    });
  }

  sendFileMessage({
    channel,
    file,
    handler
  }) {
    return channel.sendFileMessage(file, (message, error) => {
      if (handler) handler(message, error);
    });
  }

  deleteMessage({
    channel,
    message
  }) {
    return new Promise((resolve, reject) => {
      if (!this.isCurrentUser(message.sender)) {
        reject({
          message: 'You have not ownership in this message.'
        });
      }
      channel.deleteMessage(message, (response, error) => {
        error ? reject(error) : resolve(response);
      });
    });
  }

  static getInstance() {
    return new SendBirdAction();
  }
}

export {
  SendBirdAction
};

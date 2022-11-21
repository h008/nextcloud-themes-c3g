<template>
	<div class="c3g_clock__wrapper">
		<div id="c3g_clock__text" class="c3g_clock__text">
			{{ displayDate }}{{ displayTime }}
		</div>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'

export default {
	data() {
		return {
			displayDate: '',
			displayTime: '',
			youbi: ['日', '月', '火', '水', '木', '金', '土'],
			unreadTalk: 0,
			messageExists: false,
			unreadNote: 0,
			noteExists: false,
			intervalCounter: 0,
			interval: 10,
			unreadList: [
				{ app: 'spreed', unreadCount: 0, msgExists: false },
				{ app: 'welcomapp', unreadCount: 0, msgExists: false },
			],
			fileLink: '',
			notificationId: null,
			bgColorConfig: { id: 0, kind: 'bgColor', key: 'JSON', value: { sidebarBgColor: '#5677B8', mainBgColor: '#ECFCFF', contentsBgColor: '#FFFFE9' } },
		}
	},
	mounted() {
		this.getPreferences()
		this.setNotificationSpreed()
		setInterval(() => { this.intervalFunction() }, 1000)

	},
	methods: {
		setBgColors(config) {
			const sidebarElm = window.document.querySelectorAll('#app-navigation,#app-navigation-vue')
			if (config.value?.sidebarBgColor && sidebarElm?.length) {
				for (const elm of sidebarElm) {
					elm.style['background-color'] = config.value.sidebarBgColor
					this.setColorOfSideBarTitle(config.value.sidebarBgColor)

				}
			}
			const mainElm = window.document.querySelectorAll('#controls,.top-bar')
			if (config.value?.mainBgColor && mainElm?.length) {
				for (const elm of mainElm) {
					elm.style['background-color'] = config.value.mainBgColor
				}
			}
			const contentsElm = window.document.querySelectorAll('#app-content,#app-content-vue,.files-table thead')
			if (config.value?.contentsBgColor && contentsElm?.length) {
				for (const elm of contentsElm) {
					elm.style['background-color'] = config.value.contentsBgColor
				}
			}
		},
		setColorOfSideBarTitle(color) {
			// const darkColor = this.calcColor(color)
			const css = `
			form.app-navigation-search,
			#app-navigation:not(.vue) {
				background-color:${color};
			}
			#app-navigation:not(.vue)>ul>li a,
			#app-navigation:not(.vue)>ul>li>ul>li>a,
			#app-navigation a,
			#sublist-shareoverview,
			#sublist-shareoverview>li {
				color:#FFFFFF;
				background-color: ${color};
			}
			#app-navigation:not(.vue)>ul>li a.active,
			#app-navigation:not(.vue)>ul>li a:hover,
			#app-navigation-vue>ul a.list-item[id*="conversation_"]:hover,
			#app-navigation-vue>ul a.list-item--active[id*="conversation_"],
			#app-navigation-vue>ul a.list-item[id*="conversation_"]:active,
			#app-navigation:not(.vue)>ul>li>ul>li:hover,
			#app-navigation:not(.vue)>ul>li>ul>li:focus,
			#app-navigation:not(.vue)>ul>li>ul>li:focus>a {
				background-color: ${color} !important;
				filter:brightness(80%);
			}`
			const style = window.document.createElement('style')
			style.setAttribute('id', 'c3g-style')

			style.appendChild(document.createTextNode(css))
			window.document.getElementsByTagName('head')[0].appendChild(style)

			// const titleElements = window.document.querySelectorAll('#app-navigation a,#app-navigation-vue a')
		},
		calcColor(color) {
			const r = parseInt(color.slice(1, 3), 16)
			const g = parseInt(color.slice(3, 5), 16)
			const b = parseInt(color.slice(5, 7), 16)
			const darkR = Math.floor(r * 1.1).toString(16).padStart(2, '0')
			const darkG = Math.floor(g * 1.1).toString(16).padStart(2, '0')
			const darkB = Math.floor(b * 1.1).toString(16).padStart(2, '0')
			return `#${darkR}${darkG}${darkB}`

		},
		calcInvert(color) {
			const r = parseInt(color.slice(1, 3), 16)
			const g = parseInt(color.slice(3, 5), 16)
			const b = parseInt(color.slice(5, 7), 16)
			const base = Math.min(r, g, b) + Math.max(r, g, b)
			const invertR = (base - r).toString(16).padStart(2, '0')
			const invertG = (base - g).toString(16).padStart(2, '0')
			const invertB = (base - b).toString(16).padStart(2, '0')
			return `#${invertR}${invertG}${invertB}`

		},
		async fetchColorConfig() {
			let tmpData = { value: {}, messageTxt: '' }
			return await axios.get(generateUrl('/apps/welcomapp/getconfig/bgColor')).then((result) => {
				if (result.data && result.data.length) {
					tmpData = result.data[0]
					if (tmpData.value) {
						let s = tmpData.value
						s = s.replace(/\\n/g, '\\n')
							.replace(/\\'/g, "\\'")
							.replace(/\\"/g, '\\"')
							.replace(/\\&/g, '\\&')
							.replace(/\\r/g, '\\r')
							.replace(/\\t/g, '\\t')
							.replace(/\\b/g, '\\b')
							.replace(/\\f/g, '\\f')
						const value = JSON.parse(s)
						tmpData.value = value
						tmpData.messageTxt = JSON.stringify(tmpData)
						return tmpData

					}
				}
				return tmpData
			}).catch((e) => {
				tmpData.messageTxt = JSON.stringify(e)
				return tmpData
			})
		},
		async intervalFunction() {
			this.updateTime()
			const styleElement = window.document.querySelector('#c3g-style')
			if (!styleElement) {
				const resp = await this.fetchColorConfig()
				this.bgColorConfig = resp
				this.setBgColors(resp)

			}
			if (this.intervalCounter === 0) {
				const { msgExists } = await this.countUnreadNote()
				const unread = msgExists
				const data = await this.getNotifications()
				const { shared, invited, recieved, spreed, link, notificationId } = this.parseNotificationData(data)
				this.notificationId = notificationId
				this.setIndicater(shared, invited, recieved, spreed, unread, link)
				// this.getUnreadThenSet()
			}
			this.intervalCounter++
			if (this.intervalCounter > this.interval) {
				this.intervalCounter = 0
			}
		},
		updateTime() {
			const currentDate = new Date()
			const elWidth = window.innerWidth
			if (elWidth < 450) {
				this.displayTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`
				this.displayDate = ''
			} else if (elWidth < 600) {
				this.displayTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`
				this.displayDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}(${this.youbi[currentDate.getDay()]})`

			} else {
				this.displayTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`
				this.displayDate = `${currentDate.getFullYear()}年${(currentDate.getMonth() + 1).toString().padStart(2, '0')}月${currentDate.getDate().toString().padStart(2, '0')}日(${this.youbi[currentDate.getDay()]})`
			}
		},
		parseNotificationData(data) {
			let shared = false
			let invited = false
			let recieved = false
			let spreed = false
			let link = ''
			let notificationId, objectId
			if (data && data.length) {
				for (const el of data) {
					let leaveNotify = false
					if (!shared && el.app === 'files_sharing' && el.subject.match(/.*共有しました/)) {
						shared = true
						link = el.subjectRichParameters?.file.link
						notificationId = el.notification_id
						objectId = el.subjectRichParameters?.object_id
						leaveNotify = true
					} else if ((!invited || !recieved || !spreed) && el.app === 'spreed') {
						if (el.subject.match(/.*招待しました/)) {
							invited = true
							leaveNotify = true
						} else if (el.subject.match(/.*メッセージを送りました/)) {
							recieved = true
							leaveNotify = true
						} else if (el.subject.match(/.*送信しました/)) {
							recieved = true
							leaveNotify = true
						} else {
							spreed = true
							leaveNotify = true
						}
					}
					if (!leaveNotify) {
						this.deleteNotification(el.notification_id)
					}
					/*
					if (shared && invited && recieved) {
						break
					}
					*/
				}
			}
			return { shared, invited, recieved, spreed, link, notificationId, objectId }

		},
		/*
		getUnreadThenSet() {
			const that = this
			const p1 = this.getUnreadTalk()
			const p2 = this.countUnreadNote()
			Promise.all([p1, p2]).then((array) => {
				that.unreadList = that.setUnreadList(array)
				that.setUnreadCounter(that.unreadList)
			})

		},
			*/
		/*
		getUnreadTalk() {
			const url = '/ocs/v2.php/apps/spreed/api/v4/room'
			return axios(url).then((resp) => {
				let unreadTalk = 0
				let messageExist = false
				if (resp?.data?.ocs?.data && Array.isArray(resp.data.ocs.data)) {
					const rooms = resp.data.ocs.data
					for (const room of rooms) {
						if (room.displayName !== 'Talk アップデート ✅') {
							unreadTalk += room.unreadMessages || 0
							const lastRead = room.lastReadMessage || 0
							const lastMessage = room.lastMessage.id || 0
							if (lastRead < lastMessage) {
								messageExist = true
							}
						}
					}
				}
				return { app: 'spreed', unreadCount: unreadTalk, msgExists: messageExist }
			}).catch(() => {
				return this.unreadList.find((el) => el.app === 'spreed') || { app: 'spreed', unreadCount: 0, msgExists: false }

			})

		},
				*/
		async getNotifications() {
			// const url = '/ocs/v2.php/cloud/capabilities'
			// const url = '/ocs/v2.php/apps/activity/api/v2/activity'
			const url = '/ocs/v2.php/apps/notifications/api/v2/notifications'
			const resp = await axios(url)
			return resp.data?.ocs?.data || []
		},
		async getPreferences() {
			// const url = '/ocs/v2.php/apps/provisioning_api/api/v1/config/apps/activity/notify_email_calendar'
			const url = generateUrl('/apps/welcomapp/setpref/notify_notification_shared/1')
			// const data = { configValue: 1 }
			// const url = '/ocs/v2.php/apps/activity/api/v2/activity'
			// const url = '/ocs/v2.php/apps/notifications/api/v2/notifications'
			await axios.get(url)
		},
		async setNotificationSpreed() {
			const url = generateUrl('/apps/welcomapp/setpref/notify_notification_spreed/1')
			await axios.get(url)

		},

		setUnreadList(appUnreadList) {
			if (!appUnreadList || !appUnreadList.length) {
				return this.unreadList
			}
			return this.unreadList.map((el) => {
				const appUnread = appUnreadList.find((newEl) => newEl.app === el.app)
				if (appUnread) {
					return appUnread
				} else {
					return el

				}
			})

		},
		changeStyle(appName, index, flag, text, link = '') {
			const qSelector1 = `#appmenu li div button[data-badge${index}="${appName}"]`
			const qSelector2 = `#apps-data-badge${index}_${appName}`
			const qArray = [qSelector1, qSelector2]
			qArray.forEach((qSelector, index) => {

				const targetMenuElm = window.document.querySelector(qSelector)
				if (targetMenuElm && flag) {
					if (index === 0) {
						targetMenuElm.textContent = text
						targetMenuElm.style.display = 'inherit'
					} else {
						targetMenuElm.textContent = text.slice(0, 1)
					}
					targetMenuElm.style.backgroundColor = '#fff'
					targetMenuElm.style.color = 'red'
					if (appName === 'files') {
						this.fileLink = link
						targetMenuElm.removeEventListener('click', this.clicked)
						targetMenuElm.addEventListener('click', this.clicked)
					}

				} else {
					targetMenuElm.style.display = 'none'
				}
			})

		},
		async clicked() {
			await this.deleteNotification(this.notificationId)
			open(this.fileLink, '_blank')

		},
		async deleteNotification(id) {
			const url = `/ocs/v2.php/apps/notifications/api/v2/notifications/${id}`
			return await axios.delete(url)
		},
		setIndicater(shared, invited, recieved, spreed, unread, link) {
			this.changeStyle('files', 1, shared, '共有', link)
			this.changeStyle('files', 2, false, '', '')
			this.changeStyle('spreed', 1, invited, '招待')
			this.changeStyle('spreed', 2, recieved, '新コメ')
			if (spreed) {
				this.changeStyle('spreed', 2, spreed, 'Chk')
			}
			this.changeStyle('welcomapp', 1, unread, '未読')
			this.changeStyle('welcomapp', 2, false, '')
			this.changeStyle('calendar', 1, false, '')
			this.changeStyle('calendar', 2, false, '')
		},

		setUnreadCounter(unreadList) {
			for (const item of unreadList) {
				if (!item.app) { return }
				const qSelector1 = `#appmenu li div div[data-unread="${item.app}"]`
				const qSelector2 = `#apps-data-unread_${item.app}`
				for (const qSelector of [qSelector1, qSelector2]) {

					const targetMenuElm = window.document.querySelector(qSelector)
					if (!targetMenuElm) { return }
					if (item.msgExists) {
						targetMenuElm.textContent = '!'
						targetMenuElm.style.display = 'inherit'
						targetMenuElm.style.backgroundColor = 'red'
						targetMenuElm.style.color = '#fff'
					} else {
						targetMenuElm.style.backgroundColor = 'var(--color-primary-text)'
						targetMenuElm.style.color = 'inherit'
					}
					if (item.unreadCount > 0) {
						targetMenuElm.textContent = item.unreadCount
						targetMenuElm.style.display = 'inherit'
					}
					if (!item.unreadCount && !item.msgExists) {
						targetMenuElm.style.display = 'none'
					}
				}
			}
		},
		async countUnreadNote() {
			const filter = { category: 0, pubFlag: 1, pinFlag: 0, offset: 0, limit: 0, tags: 'all', unread: true }
			return await this.countTotalNote(filter).then((unreadCount) => {
				return { app: 'welcomapp', unreadCount, msgExists: (unreadCount > 0) }
			}).catch(() => {
				return this.unreadList.find((el) => el.app === 'welcomapp') || { app: 'welcomapp', unreadCount: 0, msgExists: false }

			})
		},
		async countTotalNote(filter) {
			return await axios.get(generateUrl('/apps/welcomapp/filtercount'), { params: filter })
				.then((result) => {
					return result.data
				}).catch(() => { return 0 })
		},
	},

}
</script>
<style scoped>
.c3g_clock__wrapper {
	height: 50px;
}

.c3g_clock__text {
	line-height: 50px;
	color: whitesmoke;
	font-weight: bolder;
	font-size: larger;
	max-height: 50px;
}
</style>

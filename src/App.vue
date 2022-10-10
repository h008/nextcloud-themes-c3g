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
			interval: 5,
			unreadList: [
				{ app: 'spreed', unreadCount: 0, msgExists: false },
				{ app: 'welcomapp', unreadCount: 0, msgExists: false },
			],
		}
	},
	mounted() {
		setInterval(() => { this.intervalFunction() }, 1000)
	},
	methods: {
		intervalFunction() {
			this.updateTime()
			if (this.intervalCounter === 0) {
				this.getUnreadThenSet()
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
		getUnreadThenSet() {
			const that = this
			const p1 = this.getUnreadTalk()
			const p2 = this.countUnreadNote()
			Promise.all([p1, p2]).then((array) => {
				that.unreadList = that.setUnreadList(array)
				that.setUnreadCounter(that.unreadList)
			})

		},
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
		countUnreadNote() {
			const filter = { category: 0, pubFlag: 1, pinFlag: 0, offset: 0, limit: 0, tags: 'all', unread: true }
			return this.countTotalNote(filter).then((unreadCount) => {
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
.c3g_clock__wrapper{
	height:50px;
}

.c3g_clock__text{
	line-height:50px;
	color:whitesmoke;
	font-weight: bolder;
	font-size:larger;
	max-height:50px;
}
</style>

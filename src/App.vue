<template>
	<div class="c3g_clock__wrapper">
		<div class="c3g_clock__text">
			{{ displayDate }}{{ displayTime }}
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			displayDate: '',
			displayTime: '',
			youbi: ['日', '月', '火', '水', '木', '金', '土'],
		}
	},
	mounted() {
		setInterval(() => { this.updateTime() }, 1000)
	},
	methods: {
		updateTime() {
			const currentDate = new Date()
			this.displayTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`
			this.displayDate = `${currentDate.getFullYear()}年${(currentDate.getMonth() + 1).toString().padStart(2, '0')}月${currentDate.getDate().toString().padStart(2, '0')}日(${this.youbi[currentDate.getDay()]})`
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

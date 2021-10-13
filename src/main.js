import Vue from 'vue'
import App from './App'

Vue.mixin({ methods: { t, n } })
Vue.prototype.t = window.t
Vue.prototype.n = window.n
Vue.prototype.OC = window.OC
Vue.prototype.OCA = window.OCA
export default new Vue({
	el: '#c3g-vue',
	render: h => h(App),
})

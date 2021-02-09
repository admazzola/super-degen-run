<template>
<div>

  <div class="scroll-left">
  <p> {{scrollingText}}</p>
  </div>

</div>
</template>


<style style="text/css">
.scroll-left {
 height: 30px;
 overflow: hidden;
 position: relative;
 color: orange;
}
.scroll-left p {
 position: absolute;

 height: 100%;
 margin: 0;
 line-height: 30px;
 text-align: center;
 /* Starting position */
 -moz-transform:translateX(100%);
 -webkit-transform:translateX(100%);
 transform:translateX(100%);
 /* Apply animation to this element */
 -moz-animation: scroll-left 15s linear infinite;
 -webkit-animation: scroll-left 15s linear infinite;
 animation: scroll-left 15s linear infinite;
}
/* Move it (define the animation) */
@-moz-keyframes scroll-left {
 0%   { -moz-transform: translateX(100%); }
 100% { -moz-transform: translateX(-100%); }
}
@-webkit-keyframes scroll-left {
 0%   { -webkit-transform: translateX(100%); }
 100% { -webkit-transform: translateX(-100%); }
}
@keyframes scroll-left {
 0%   {
 -moz-transform: translateX(100%); /* Browser bug fix */
 -webkit-transform: translateX(100%); /* Browser bug fix */
 transform: translateX(100%);
 }
 100% {
 -moz-transform: translateX(-100%); /* Browser bug fix */
 -webkit-transform: translateX(-100%); /* Browser bug fix */
 transform: translateX(-100%);
 }
}
</style>






<script>



export default {



  name: 'Header',
  props: [ ],
  data() {
    return {
      scrollingText: "BREAKING: The Imperial Legion of Satoshi's Children has sent a patrol of starships to the Badlands. "
    }
  },
  methods: {





  }

}
</script>

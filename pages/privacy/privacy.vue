<template>
  <view class="container">

    <!-- 协议内容区域 -->
    <!-- scroll-view 必须设置高度，这里通过 flex: 1 自动填充剩余空间 -->
    <scroll-view
      scroll-y
      class="agreement-scroll-view"
      :scroll-top="scrollTop"
      @scroll="onScroll"
    >
      <view class="agreement-content">
        <!-- 使用 rich-text 显示解析后的HTML内容 -->
        <rich-text :nodes="agreementHtml"></rich-text>
      </view>
    </scroll-view>

    <!-- 返回顶部按钮 -->
    <view
      v-if="showScrollToTop"
      class="scroll-to-top-btn"
      @click="scrollToTop"
    >
      <uni-icons type="arrow-up" size="24" color="#fff"></uni-icons>
    </view>
  </view>
</template>

<script>

export default {
  data() {
    return {
      // 用户服务协议的原始文本内容
      agreementText: `
# 隐私政策和用户使用协议

**生效日期：2025-4-3**

## 一、总则

1.1 本协议是您与"浅音律动游戏乐园工作室"（以下简称"我们"或"本公司"）之间关于您使用我们提供的“鱼窝预约”（以下简称"本服务"）所订立的协议。

1.2 本服务包括但不限于我们运营的网站、移动应用程序、微信小程序等各类平台上提供的服务内容。

1.3 在您注册成为本服务的用户前，请您仔细阅读本协议，确保您充分理解本协议中各条款的含义。一旦您选择"同意"并完成注册流程，或者您实际使用本服务，即表示您已充分理解并同意受本协议的约束。

1.4 我们有权在必要时修改本协议条款。您可以在相关服务页面查阅最新版本的协议条款。本协议条款变更后，如果您继续使用本服务，即视为您已接受修改后的协议。

## 二、账号注册与使用

2.1 注册资格

您确认，在您完成注册程序或以其他我们允许的方式实际使用本服务时，您应当具备中华人民共和国法律规定的与您行为相适应的民事行为能力。若您不具备前述与您行为相适应的民事行为能力，则您及您的监护人应依照法律规定承担因此而导致的一切后果。

2.2 注册流程

2.2.1 您在注册时需要提供真实、准确、完整的个人资料，包括但不限于用户名、手机号码等信息，并及时更新。

2.2.2 您注册成功后，我们将为您创建账号及相应的密码，您可以使用您注册时填写的用户名、手机号码或我们允许的其他方式登录本服务。

2.2.3 您理解并承诺，您所设置的账号不得违反国家法律法规和本公司的相关规则，不得实施任何侵害国家利益、损害其他公民合法权益，有害社会道德风尚的行为。

2.3 账号安全

2.3.1 您的账号为您自行设置并由您保管，本公司任何时候均不会主动要求您提供您的账号密码。

2.3.2 您应对您的账号（包括但不限于用户名、头像、昵称等）及密码的安全负全部责任，且须对您在该账号下的所有行为负全部责任。

2.3.3 您同意，如发现任何人未经授权使用您的账号或有任何其他可能危及您的账号安全的情形时，您应立即通知本公司。

## 三、服务内容及规范

3.1 服务内容

3.1.1 本服务的具体内容由本公司根据实际情况提供。

3.1.2 本服务中的部分内容为免费服务，部分内容可能需要您付费后才能使用，您可通过在线支付方式购买相关线下服务内容。

3.2 服务规范

3.2.1 您在使用本服务时，必须遵守中华人民共和国相关法律法规的规定，不得利用本服务从事违法违规行为，包括但不限于：

  - 发布、传送、传播、储存违反国家法律法规的信息；
  - 发布、传送、传播、储存侵害他人名誉权、肖像权、知识产权、商业秘密等合法权利的信息；
  - 恶意使用本服务，导致本公司服务器过度负荷或其他影响本服务正常运行的行为；
  - 其他违反法律法规、社会公共利益或公共道德、损害他人合法权益的行为。

3.2.2 如您违反上述规定，本公司有权采取相应措施，包括但不限于删除相关内容、暂停或终止提供服务、封禁账号等，并保留追究您法律责任的权利。

## 四、用户个人信息保护

4.1 我们非常重视您的个人信息保护，并严格遵守相关法律法规的要求收集、使用、存储和共享您的个人信息。

4.2 我们收集的个人信息包括但不限于：用户名、头像、昵称、手机号码、QQ号等信息。我们收集这些信息的目的是为了向您提供服务、优化我们的服务以及履行法律法规规定的义务。

4.3 我们承诺：

4.3.1 未经您的同意，不会向第三方披露您的个人信息，法律法规另有规定的除外；

4.3.2 采取合理措施保护您的个人信息安全；

4.3.3 在您注销账号时，根据相关法律法规的要求处理您的个人信息。

4.4 您同意，在下列情况下，我们有权共享、转让、披露您的个人信息：

4.4.1 获得您的明确同意；

4.4.2 根据法律法规的规定或行政、司法机构的要求；

4.4.3 为维护社会公共利益，保护我们、我们的用户或雇员的人身和财产安全或合法权益；

4.4.4 在涉及合并、收购、资产转让或类似的交易时。

4.5 更多关于个人信息保护的内容，请参见我们的《隐私政策》。

## 五、知识产权

5.1 本服务中的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等，均由本公司或其他权利人依法拥有其知识产权，包括但不限于商标权、专利权、著作权、商业秘密等。

5.2 未经本公司或相关权利人的书面许可，您不得以任何方式擅自使用、复制、转载、分发、修改、展示本服务中的内容。

5.3 您在使用本服务时发布的内容，您保证对该等内容享有合法权利。您同意授予本公司非独占的、可转授权的、不可撤销的、全球通用的、免费的许可使用权，许可本公司使用、复制、修改、改编、出版、翻译、据以创作衍生作品、传播、表演和展示该等内容，或将该等内容并入其他作品中。

## 六、免责声明

6.1 您理解并同意，本服务可能会受到多种因素的影响，包括但不限于不可抗力、网络服务质量、第三方服务等原因导致的服务中断或不能满足您的要求的情况。本公司对此不承担任何责任。

6.2 本公司不对本服务之及时性、安全性、准确性做出任何承诺，您因使用本服务而产生的风险自行承担。

6.3 对于您通过本服务访问的第三方网站或使用第三方服务所产生的后果，本公司不承担任何责任。

6.4 本公司有权但无义务对用户发布的内容进行审核，对于用户发布的涉嫌违法或涉嫌侵犯他人合法权利或违反本协议的内容，本公司有权进行处理。

## 七、服务变更、中断或终止

7.1 您理解并同意，本公司提供的服务是按照现有技术和条件所能达到的现状提供的。本公司会尽最大努力向您提供服务，确保服务的连贯性和安全性。

7.2 本公司有权在必要时变更、中断或终止部分或全部服务，包括但不限于：

7.2.1 根据法律法规变化或政府要求；

7.2.2 因技术上的调整和维护；

7.2.3 因不可抗力因素导致的服务中断或终止；

7.2.4 其他本公司认为需要中断或终止服务的情况。

7.3 如果您违反本协议中规定的使用规则，本公司有权中断或终止向您提供服务。

## 八、用户隐私协议

根据法律规定，开发者仅处理实现小程序功能所必要的信息。

8.1 为了（减少用户注册流程，快速实现登录），开发者将在获取你的明示同意后，收集你的微信昵称、头像。

8.2 为了（确保登录信息的真实性），开发者将在获取你的明示同意后，收集你的手机号。

8.3 为了（保证下载图片功能正常使用），开发者将在获取你的明示同意后，使用你的相册（仅写入）权限。

## 九、法律适用与争议解决

9.1 本协议的订立、执行和解释及争议的解决均应适用中华人民共和国大陆地区法律。

9.2 如双方就本协议内容或其执行发生任何争议，双方应尽量友好协商解决；协商不成时，任何一方均可向本公司所在地有管辖权的人民法院提起诉讼。

## 十、其他

10.1 本协议构成您与本公司之间就本服务达成的完整协议，取代您与本公司先前就本服务达成的任何口头或书面协议。

10.2 本协议中的标题仅为方便而设，不具有任何法律或合同效力。

10.3 本协议的任何条款无论因何种原因完全或部分无效或不具有执行力，本协议的其余条款仍应有效并且有约束力。

10.4 本公司对本协议拥有最终解释权。

**特别提示：** 您在使用本服务前，请认真阅读本协议，确保您已经完全理解并接受本协议的所有条款。

浅音律动游戏乐园工作室

395322960@qq.com

2025-4-3
      `,
      agreementHtml: '', // 存储转换后的HTML
      scrollTop: 0, // scroll-view 的滚动位置
      oldScrollTop: 0, // 用于辅助滚动到顶部
      showScrollToTop: false, // 是否显示返回顶部按钮
      scrollThreshold: 200, // 滚动超过此距离显示返回顶部按钮 (px)
    };
  },
  created() {
    this.parseAgreementText();
  },
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack({
        delta: 1,
      });
    },
    /**
     * 滚动到页面顶部
     */
    scrollToTop() {
      // UniApp scroll-view 的 scroll-top 属性，如果目标值与当前值相同，不会触发滚动。
      // 因此，需要先将其设置为一个非0值（如果当前在顶部），再设置为0，以确保滚动事件被触发。
      this.oldScrollTop = this.scrollTop;
      this.scrollTop = this.oldScrollTop === 0 ? 1 : 0; // 如果已经在顶部，先设为1，否则设为0
      this.$nextTick(() => {
        this.scrollTop = 0; // 最终设为0，完成滚动
      });
    },
    /**
     * 监听 scroll-view 滚动事件
     * 根据滚动距离判断是否显示返回顶部按钮
     */
    onScroll(e) {
      const currentScrollTop = e.detail.scrollTop;
      if (currentScrollTop > this.scrollThreshold && !this.showScrollToTop) {
        this.showScrollToTop = true;
      } else if (currentScrollTop <= this.scrollThreshold && this.showScrollToTop) {
        this.showScrollToTop = false;
      }
    },
    /**
     * 解析 Markdown 格式的协议文本为 HTML
     * 这是一个简化的解析器，用于处理标题、粗体和简单的列表
     */
    parseAgreementText() {
      let html = this.agreementText;

      // 替换标题
      html = html.replace(/^#\s(.+)$/gm, '<h1>$1</h1>');
      html = html.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');
      html = html.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');

      // 替换粗体
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // 将文本按行分割，以便处理段落和列表
      let lines = html.split('\n');
      let processedLines = [];
      let inList = false; // 标记是否在列表内部

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.startsWith('<h1>') || line.startsWith('<h2>') || line.startsWith('<h3>')) {
          // 如果遇到标题，且之前在列表中，则结束列表
          if (inList) {
            processedLines.push('</ul>');
            inList = false;
          }
          processedLines.push(line);
        } else if (line.match(/^(\d+\.|\-)\s/)) { // 匹配数字列表或无序列表项
          // 如果不在列表中，则开始一个无序列表
          if (!inList) {
            processedLines.push('<ul>');
            inList = true;
          }
          // 移除列表标记，直接作为列表项内容
          let listItemContent = line.replace(/^(\d+\.|\-)\s/, '');
          processedLines.push(`<li>${listItemContent}</li>`);
        } else if (line === '') {
          // 如果遇到空行，且之前在列表中，则结束列表
          if (inList) {
            processedLines.push('</ul>');
            inList = false;
          }
          processedLines.push(''); // 保留空行，后续处理
        } else {
          // 如果不在列表中，且不是标题或列表项，则视为普通段落
          if (inList) {
            processedLines.push('</ul>'); // 结束前一个列表
            inList = false;
          }
          processedLines.push(`<p>${line}</p>`);
        }
      }

      // 如果文档以列表结束，确保关闭列表标签
      if (inList) {
        processedLines.push('</ul>');
      }

      html = processedLines.join('');

      // 移除多余的空行生成的<p></p>
      html = html.replace(/<p>\s*<\/p>/g, '');
      // 移除可能因为空行导致的空<ul></ul>
      html = html.replace(/<ul>\s*<\/ul>/g, '');

      this.agreementHtml = html;
    },
  },
};
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: 100vh; // 确保页面占满整个视口高度
  background-color: #f8f8f8;
}

.agreement-scroll-view {
  flex: 1; // 占据剩余空间
  padding: 0 30rpx; // 左右内边距
  box-sizing: border-box;
  /* 动态计算顶部填充，确保内容从导航栏下方开始 */
  /* var(--status-bar-height) 是 UniApp 提供的状态栏高度变量 */
  /* 44px 是 uni-nav-bar 的默认高度 */
  padding-top: calc(var(--status-bar-height) + 44px);
}

.agreement-content {
  padding-bottom: 50rpx; // 底部留白，避免内容被返回顶部按钮遮挡
  line-height: 1.8;
  font-size: 28rpx;
  color: #333;

  /* rich-text 内部元素的样式需要通过全局样式或组件内样式穿透来控制 */
  /* 这里使用 ::v-deep 或 ::v-deep 进行样式穿透 */
  ::v-deep h1 {
    font-size: 40rpx;
    font-weight: bold;
    text-align: center;
    margin: 40rpx 0;
  }

  ::v-deep h2 {
    font-size: 36rpx;
    font-weight: bold;
    margin: 30rpx 0 20rpx;
  }

  ::v-deep h3 {
    font-size: 32rpx;
    font-weight: bold;
    margin: 25rpx 0 15rpx;
  }

  ::v-deep strong {
    font-weight: bold;
  }

  ::v-deep p {
    margin-bottom: 1em;
    text-indent: 2em; // 段落首行缩进
  }

  ::v-deep ul {
    margin-left: 1em; // 列表整体缩进
    padding-left: 0;
  }

  ::v-deep li {
    margin-bottom: 0.5em;
    list-style-type: disc; // 无序列表点
    margin-left: 1em; // 列表项缩进
  }
}

.scroll-to-top-btn {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
  z-index: 999;
}
</style>

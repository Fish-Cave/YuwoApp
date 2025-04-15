<template>
    <view class="container">
        <!-- 标题 -->
        <view class="title">{{ pageTitle }}</view>

        <!-- 加载状态 -->
        <view v-if="loading && !initialContentLoaded" class="loading-state">
            <uni-load-more status="loading"></uni-load-more>
        </view>

        <!-- 错误状态 -->
        <view v-if="errorMsg" class="error-state">
            <text>{{ errorMsg }}</text>
            <button v-if="!isHtmlOnApp" size="mini" @click="retryLoad">重试</button>
        </view>

        <!-- 内容区域 -->
        <view v-if="!errorMsg && initialContentLoaded" class="content-area">
            <!-- PDF 处理 (保持不变) -->
            <view v-if="isPdf">
                <view class="pdf-tip">
                    <text>PDF 文档需要下载后使用您设备上的 PDF 阅读器打开。</text>
                    <button v-if="!pdfFilePath" size="mini" type="primary" @click="downloadAndOpenPdf" :loading="loading">下载并打开</button>
                    <button v-else size="mini" type="primary" @click="openPdfDocument">重新打开</button>
                    <view v-if="loading && isPdf" class="loading-text">正在处理...</view>
                    <view v-if="errorMsg && isPdf" class="error-text">{{ errorMsg }}</view>
                </view>
            </view>

            <!-- HTML 处理 -->
            <view v-else-if="isHtml">
                <!-- App 端: 提供按钮跳转到外部浏览器 -->
                <!-- #ifdef APP-PLUS -->
                <view class="html-app-tip">
                    <text>将在您设备的默认浏览器中打开此帮助页面。</text>
                    <button type="primary" @click="openInDeviceBrowser">立即打开</button>
                </view>
                <!-- #endif -->

                <!-- 非 App 端 (小程序, H5): 使用 web-view -->
                <!-- #ifndef APP-PLUS -->
                <web-view v-if="helpUrl" :src="helpUrl" @message="handleWebViewMessage" @error="handleWebViewError"></web-view>
                <!-- #endif -->
            </view>

            <!-- 其他文件类型或无法识别 -->
            <view v-else>
                 <text>不支持预览此文件类型。</text>
                 <!-- 可以选择提供复制链接的功能 -->
                 <button size="mini" @click="copyUrl">复制链接</button>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const pageTitle = ref('帮助文档');
const helpUrl = ref('');
const loading = ref(false);
const errorMsg = ref('');
const pdfFilePath = ref(''); // 存储下载的 PDF 临时路径
const initialContentLoaded = ref(false); // 标记初始信息是否加载完毕
const isHtmlOnApp = ref(false); // 标记是否是App端加载HTML

// --- 计算属性 ---
// 判断是否是 PDF 链接
const isPdf = computed(() => helpUrl.value.toLowerCase().endsWith('.pdf'));
// 判断是否是 HTML 链接 (你可以根据实际情况调整，比如也检查 .htm)
const isHtml = computed(() => {
    const lowerCaseUrl = helpUrl.value.toLowerCase();
    return lowerCaseUrl.endsWith('.html') || lowerCaseUrl.endsWith('.htm');
    // 或者，如果你的 .md 链接没有改后缀，但你知道它们是 HTML，可以这样判断：
    // return lowerCaseUrl.endsWith('.md'); // 假设 .md 后缀的链接实际是 HTML
});

// --- 生命周期 ---
onMounted(() => {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options || currentPage.$page?.options;

    if (options) {
        if (options.title) {
            pageTitle.value = decodeURIComponent(options.title);
            uni.setNavigationBarTitle({ title: pageTitle.value });
        }
        if (options.url) {
            helpUrl.value = decodeURIComponent(options.url);
            // 初始内容已确定，可以显示页面结构了
            initialContentLoaded.value = true;
            // 判断是否是 App 端加载 HTML
            // #ifdef APP-PLUS
            if (isHtml.value) {
                isHtmlOnApp.value = true;
                // App端不需要加载，直接显示按钮
                loading.value = false; // 停止加载状态
            } else if (isPdf.value) {
                 // PDF 在 App 端也需要处理（下载）
                 // loading 状态由 downloadAndOpenPdf 控制
            } else {
                 loading.value = false; // 不支持的格式，停止加载
            }
            // #endif
            // #ifndef APP-PLUS
            // 非 App 端，如果是 HTML 或 PDF，loading 状态会在各自处理函数中控制
            // 如果不是 HTML 或 PDF，则停止加载
            if (!isHtml.value && !isPdf.value) {
                 loading.value = false;
            }
            // #endif

        } else {
             errorMsg.value = "缺少必要的文档链接参数 (url)";
             initialContentLoaded.value = true; // 即使出错，也标记为已加载，以显示错误信息
             loading.value = false;
        }
    } else {
         errorMsg.value = "无法获取页面参数";
         initialContentLoaded.value = true;
         loading.value = false;
    }
});

// --- 方法 ---

// 重试加载（主要用于非 App HTML 或 PDF 下载失败）
function retryLoad() {
    errorMsg.value = '';
    if (isPdf.value) {
        downloadAndOpenPdf();
    }
    // 对于非 App 的 HTML，web-view 会自动重试加载，这里不需要特别处理
    // 但如果 web-view 加载出错，可能需要提供刷新按钮或提示
}

// --- PDF 处理 ---
async function downloadPdf() {
    // ... (保持之前的 downloadPdf 实现)
    return new Promise<void>((resolve, reject) => {
        uni.showLoading({ title: '下载 PDF 中...' });
        uni.downloadFile({
            url: helpUrl.value,
            success: (res) => {
                if (res.statusCode === 200) {
                    pdfFilePath.value = res.tempFilePath;
                    console.log('PDF 下载成功:', pdfFilePath.value);
                    uni.hideLoading();
                    resolve();
                } else {
                    uni.hideLoading();
                    reject(new Error(`下载失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                uni.hideLoading();
                console.error('PDF 下载失败:', err);
                reject(new Error('下载 PDF 文件失败'));
            }
        });
    });
}

function openPdfDocument() {
    // ... (保持之前的 openPdfDocument 实现)
    if (!pdfFilePath.value) {
        errorMsg.value = 'PDF 文件尚未下载或下载失败。';
        uni.showToast({ title: '请先下载文件', icon: 'none' });
        return;
    }
    uni.openDocument({
        filePath: pdfFilePath.value,
        showMenu: true,
        success: () => { console.log('打开 PDF 成功'); errorMsg.value = ''; }, // 清除错误信息
        fail: (err) => {
            console.error('打开 PDF 失败:', err);
            errorMsg.value = '无法打开 PDF 文件，请确保您安装了 PDF 阅读器。';
            uni.showModal({
                title: '打开失败',
                content: '无法打开 PDF 文件，请确保您安装了 PDF 阅读器。',
                showCancel: false
            });
        }
    });
}

async function downloadAndOpenPdf() {
    loading.value = true;
    errorMsg.value = '';
    try {
        await downloadPdf();
        openPdfDocument();
    } catch (error: any) {
        errorMsg.value = `处理 PDF 失败: ${error.message || '请重试'}`;
    } finally {
        loading.value = false;
    }
}

// --- HTML 处理 ---

// App 端：在设备浏览器中打开
function openInDeviceBrowser() {
    // #ifdef APP-PLUS
    plus.runtime.openURL(helpUrl.value, (err) => {
        console.error('plus.runtime.openURL failed: ', err);
        uni.showModal({
            title: '打开失败',
            content: '无法在浏览器中打开链接，请检查网络或链接是否有效。',
            showCancel: false
        });
    });
    // #endif
}

// 非 App 端：处理 web-view 的消息 (可选)
function handleWebViewMessage(event: any) {
    console.log('收到来自 web-view 的消息：', event.detail.data);
    // 处理从 HTML 页面 postMessage 过来的数据
}

// 非 App 端：处理 web-view 加载错误 (可选)
function handleWebViewError(event: any) {
    console.error('web-view 加载错误:', event);
    // 可以在这里显示错误提示，但 web-view 本身可能也会显示错误页
    // errorMsg.value = "帮助页面加载失败，请检查网络连接或稍后重试。";
    // loading.value = false; // 确保停止加载状态
}

// --- 其他 ---
function copyUrl() {
    uni.setClipboardData({
        data: helpUrl.value,
        success: () => {
            uni.showToast({ title: '链接已复制', icon: 'none' });
        },
        fail: () => {
            uni.showToast({ title: '复制失败', icon: 'none' });
        }
    });
}

</script>

<style scoped>
.container {
    padding: 10px;
    display: flex;
    flex-direction: column;
    height: 100vh; /* 让容器占满屏幕高度 */
    box-sizing: border-box;
}
.title {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
    margin-bottom: 10px;
    flex-shrink: 0; /* 防止标题被压缩 */
}
.loading-state, .error-state {
    text-align: center;
    padding: 50px 0;
    color: #999;
    flex-shrink: 0;
}
.error-state button {
    margin-top: 10px;
}
.content-area {
    flex-grow: 1; /* 让内容区域占据剩余空间 */
    overflow: hidden; /* 需要时可以滚动 */
    display: flex; /* 使用 flex 布局 */
    flex-direction: column; /* 垂直排列 */
}

/* PDF 提示样式 */
.pdf-tip {
    padding: 20px;
    text-align: center;
    border: 1px solid #eee;
    border-radius: 5px;
    margin: 15px;
    background-color: #f9f9f9;
    flex-shrink: 0;
}
.pdf-tip text {
    display: block;
    margin-bottom: 15px;
    color: #666;
}
.pdf-tip button {
    margin: 5px;
}
.loading-text, .error-text {
    font-size: 12px;
    color: #999;
    margin-top: 10px;
}
.error-text {
    color: #ff5a5f;
}

/* App 端 HTML 提示样式 */
.html-app-tip {
    padding: 30px 15px;
    text-align: center;
    flex-shrink: 0;
}
.html-app-tip text {
    display: block;
    margin-bottom: 20px;
    color: #333;
    font-size: 16px;
}

/* Web-view 样式 */
/* #ifndef APP-PLUS */
web-view {
    width: 100%;
    height: 100%; /* web-view 需要明确的高度 */
    flex-grow: 1; /* 占据父容器剩余空间 */
}
/* #endif */

/* 不支持格式的样式 */
.content-area > view:last-child { /* 应用于最后一个直接子 view */
    padding: 20px;
    text-align: center;
    color: #666;
    flex-shrink: 0;
}
.content-area > view:last-child button {
    margin-top: 15px;
}
</style>

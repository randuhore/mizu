document.addEventListener('DOMContentLoaded', function() {
  console.log('Copy functions script loaded');
  
  // Function to copy text with fallback
  function copyToClipboard(text, notificationElement) {
    console.log('Attempting to copy:', text);
    
    // Create a temporary textarea element to perform the copy
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    let success = false;
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        success = true;
        console.log('Copied using Clipboard API');
      } else {
        // Fallback to document.execCommand
        success = document.execCommand('copy');
        console.log('Copied using execCommand:', success);
      }
      
      // Show notification
      if (notificationElement) {
        if (notificationElement.classList) {
          notificationElement.classList.add('show');
          setTimeout(() => {
            notificationElement.classList.remove('show');
          }, 2000);
        } else {
          notificationElement.style.opacity = '1';
          notificationElement.style.visibility = 'visible';
          setTimeout(() => {
            notificationElement.style.opacity = '0';
            notificationElement.style.visibility = 'hidden';
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Copy failed:', err);
      success = false;
    }
    
    // Clean up
    document.body.removeChild(textarea);
    return success;
  }
  
  // PRESALE PAGE COPY FUNCTION
  const presaleCopyBtn = document.getElementById('copyBtn');
  const presaleWalletAddress = document.getElementById('walletAddress');
  const presaleCopyAlert = document.getElementById('copyAlert');
  
  if (presaleCopyBtn && presaleWalletAddress && presaleCopyAlert) {
    console.log('Presale copy elements found');
    
    presaleCopyBtn.addEventListener('click', function() {
      console.log('Presale copy button clicked');
      copyToClipboard(presaleWalletAddress.textContent, presaleCopyAlert);
    });
  }
  
  // INDEX PAGE - CONTRACT COPY FUNCTION
  // Look for a stat-item that has a stat-label containing "Contract"
  const allStatItems = document.querySelectorAll('.stat-item');
  console.log('Found stat items:', allStatItems.length);
  
  let contractStatItem = null;
  
  allStatItems.forEach(item => {
    const label = item.querySelector('.stat-label');
    if (label && label.textContent.trim() === "Contract") {
      contractStatItem = item;
      console.log('Found contract stat item');
    }
  });
  
  if (contractStatItem) {
    const contractValueElement = contractStatItem.querySelector('.stat-value');
    
    if (contractValueElement) {
      console.log('Found contract value element');
      
      // Get the original contract text
      const fullContract = contractValueElement.textContent;
      console.log('Contract text:', fullContract);
      
      // Create a shortened version
      const shortContract = fullContract.substring(0, 4) + '...' + fullContract.substring(fullContract.length - 4);
      
      // Create custom elements for copy functionality
      const contractContainer = document.createElement('div');
      contractContainer.className = 'contract-container';
      
      const tooltipElement = document.createElement('span');
      tooltipElement.className = 'tooltip';
      tooltipElement.textContent = 'Copied!';
      
      const shortContractSpan = document.createElement('span');
      shortContractSpan.className = 'short-contract';
      shortContractSpan.textContent = shortContract;
      
      const copyIconSpan = document.createElement('span');
      copyIconSpan.className = 'copy-icon';
      copyIconSpan.title = 'Copy to clipboard';
      copyIconSpan.innerHTML = '<i class="far fa-copy"></i>';
      
      const hiddenFullContract = document.createElement('span');
      hiddenFullContract.className = 'full-contract';
      hiddenFullContract.style.display = 'none';
      hiddenFullContract.textContent = fullContract;
      
      // Assemble the elements
      contractContainer.appendChild(shortContractSpan);
      contractContainer.appendChild(copyIconSpan);
      contractContainer.appendChild(tooltipElement);
      contractContainer.appendChild(hiddenFullContract);
      
      // Replace the original content
      contractValueElement.innerHTML = '';
      contractValueElement.appendChild(contractContainer);
      
      // Add the click event
      copyIconSpan.addEventListener('click', function(e) {
        console.log('Contract copy icon clicked');
        e.stopPropagation();
        copyToClipboard(fullContract, tooltipElement);
      });
    }
  }
});
import 'homepage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../fetch/fetchproduct.dart';
import 'package:google_fonts/google_fonts.dart';

class QuantityInputPage extends StatefulWidget {
  final String barcode;
  final bool isInItemMode; // true for "in item", false for "out item"

  const QuantityInputPage({
    super.key,
    required this.barcode,
    required this.isInItemMode,
  });

  @override
  State<QuantityInputPage> createState() => _QuantityInputPageState();
}

class _QuantityInputPageState extends State<QuantityInputPage> {
  final TextEditingController _quantityController = TextEditingController();
  int _quantity = 1;
  bool _isLoading = false;
  Map<String, dynamic>? _productData;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _quantityController.text = _quantity.toString();
    _fetchProductData();
  }

  @override
  void dispose() {
    _quantityController.dispose();
    super.dispose();
  }

  Future<void> _fetchProductData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // First check network connectivity
      final isConnected = await ProductService.checkConnectivity();
      if (!isConnected) {
        setState(() {
          _errorMessage =
              'Network connection failed. Please check:\n\n1. Server is running on port 4000\n2. Device is connected to the same network\n3. Firewall allows connections to port 4000';
          _isLoading = false;
        });
        return;
      }

      final productData = await ProductService.fetchProductByBarcode(
        widget.barcode,
      );
      if (!mounted) return;

      if (productData == null) {
        setState(() {
          _errorMessage =
              'Product with barcode "${widget.barcode}" not found in database.\n\nPlease check:\n1. Barcode is correct\n2. Product exists in inventory\n3. Product is not archived';
          _isLoading = false;
        });
      } else {
        setState(() {
          _productData = productData;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;

      String errorMsg = 'Error fetching product data.\n\n';
      if (e.toString().contains('SocketException')) {
        errorMsg += 'Network connection failed. Please check:\n';
        errorMsg += '1. Server is running (npm start in server folder)\n';
        errorMsg += '2. Device is on the same network\n';
        errorMsg += '3. IP address is correct in fetchproduct.dart\n';
        errorMsg += '4. Firewall allows connections to port 4000';
      } else if (e.toString().contains('TimeoutException')) {
        errorMsg += 'Request timed out. Server may be slow or unreachable.';
      } else {
        errorMsg += e.toString();
      }

      setState(() {
        _errorMessage = errorMsg;
        _isLoading = false;
      });
    }
  }

  void _incrementQuantity() {
    setState(() {
      _quantity++;
      _quantityController.text = _quantity.toString();
    });
  }

  void _decrementQuantity() {
    if (_quantity > 1) {
      setState(() {
        _quantity--;
        _quantityController.text = _quantity.toString();
      });
    }
  }

  void _onQuantityChanged(String value) {
    final newQuantity = int.tryParse(value);
    if (newQuantity != null && newQuantity > 0) {
      setState(() {
        _quantity = newQuantity;
      });
    }
  }

  Future<void> _saveItem() async {
    if (_productData == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Product not found in database'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Check if trying to remove items when stock is zero
    if (!widget.isInItemMode) {
      final currentStock = _productData!['stocks'] ?? 0;
      if (currentStock == 0) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Cannot remove items: Stock is already zero (out of stock)',
            ),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
        return;
      }

      // Check if trying to remove more than available stock
      if (_quantity > currentStock) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Cannot remove $_quantity items: Only $currentStock items available in stock',
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
        return;
      }
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Update the product quantity in the database
      final success = await ProductService.updateProductQuantity(
        widget.barcode,
        _quantity,
        widget.isInItemMode,
      );

      if (!success) {
        throw Exception('Failed to update product quantity');
      }

      // Log the transaction
      // final transactionSuccess = await ProductService.logTransaction(
      //   widget.barcode,
      //   _quantity,
      //   widget.isInItemMode,
      //   null,
      // );

      // if (!transactionSuccess) {
      //   throw Exception('Failed to log transaction');
      // }

      // Get the updated product data after the transaction
      final updatedProduct = await ProductService.fetchProductByBarcode(
        widget.barcode,
      );

      if (updatedProduct == null) {
        throw Exception('Failed to fetch updated product data');
      }

      // Show success message
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isInItemMode
                ? 'Successfully added $_quantity items to inventory'
                : 'Successfully removed $_quantity items from inventory',
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );

      // Navigate back to the homepage
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const HomePage()),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isInMode = widget.isInItemMode;
    final primaryColor = isInMode ? Colors.green : Colors.red;
    final gradientColors = isInMode
        ? [Colors.green, Colors.green.shade700]
        : [Colors.red, Colors.red.shade700];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          isInMode ? 'Stock In' : 'Stock Out',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white, Color(0xFFf8f9ff)],
          ),
        ),
        child: _isLoading
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Loading product data...'),
                  ],
                ),
              )
            : _errorMessage != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        'Connection Error',
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Troubleshooting Steps:',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.red[800],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _errorMessage!,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Colors.red[700],
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _fetchProductData,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.arrow_back),
                            label: const Text('Go Back'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Mode Indicator
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 20),
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 20,
                      ),
                      decoration: BoxDecoration(
                        color: primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: primaryColor, width: 2),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isInMode ? Icons.add_circle : Icons.remove_circle,
                            color: primaryColor,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isInMode
                                ? 'Adding Items to Inventory'
                                : 'Removing Items from Inventory',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Product Information
                    if (_productData != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.inventory,
                                  color: primaryColor,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Product Information',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: primaryColor,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Brand: ${_productData!['brand'] ?? 'N/A'}',
                              style: GoogleFonts.poppins(fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Category: ${_productData!['category'] ?? 'N/A'}',
                              style: GoogleFonts.poppins(fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  'Current Stock: ${_productData!['stocks'] ?? 0}',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: (_productData!['stocks'] ?? 0) == 0
                                        ? Colors.red
                                        : primaryColor,
                                  ),
                                ),
                                if ((_productData!['stocks'] ?? 0) == 0) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.red,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      'OUT OF STOCK',
                                      style: GoogleFonts.poppins(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            if (_productData!['description'] != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Description: ${_productData!['description']}',
                                style: GoogleFonts.poppins(fontSize: 14),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Barcode Display
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(25),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: gradientColors,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.qr_code,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Scanned Barcode:',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(15),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.3),
                              ),
                            ),
                            child: Text(
                              widget.barcode,
                              style: GoogleFonts.jetBrainsMono(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 30),

                    // Warning for zero stock in remove mode
                    if (!widget.isInItemMode &&
                        (_productData?['stocks'] ?? 0) == 0) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.warning_amber_rounded,
                              color: Colors.red[700],
                              size: 24,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'This product is out of stock. You cannot remove items when stock is zero.',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: Colors.red[700],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Quantity Section
                    Text(
                      'Quantity:',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: primaryColor,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quantity Input with +/- buttons
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          // Decrement button
                          Container(
                            width: 55,
                            height: 55,
                            decoration: BoxDecoration(
                              color: _quantity > 1
                                  ? Colors.red[50]
                                  : Colors.grey[100],
                              borderRadius: BorderRadius.circular(15),
                              border: Border.all(
                                color: _quantity > 1
                                    ? Colors.red[200]!
                                    : Colors.grey[300]!,
                              ),
                            ),
                            child: IconButton(
                              onPressed: _quantity > 1
                                  ? _decrementQuantity
                                  : null,
                              icon: Icon(
                                Icons.remove,
                                color: _quantity > 1
                                    ? Colors.red[700]
                                    : Colors.grey[500],
                                size: 24,
                              ),
                            ),
                          ),

                          const SizedBox(width: 20),

                          // Quantity text field
                          Expanded(
                            child: TextField(
                              controller: _quantityController,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.poppins(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: primaryColor,
                              ),
                              decoration: InputDecoration(
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide(color: primaryColor),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide(
                                    color: Colors.grey[300]!,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide(
                                    color: primaryColor,
                                    width: 2,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 15,
                                ),
                              ),
                              onChanged: _onQuantityChanged,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                            ),
                          ),

                          const SizedBox(width: 20),

                          // Increment button
                          Container(
                            width: 55,
                            height: 55,
                            decoration: BoxDecoration(
                              color: primaryColor,
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryColor.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: _incrementQuantity,
                              icon: Icon(
                                Icons.add,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Save Button
                    Container(
                      width: double.infinity,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: ElevatedButton.icon(
                        onPressed:
                            _isLoading ||
                                (!widget.isInItemMode &&
                                    (_productData?['stocks'] ?? 0) == 0)
                            ? null
                            : _saveItem,
                        icon: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : Icon(
                                isInMode ? Icons.add : Icons.remove,
                                size: 24,
                              ),
                        label: Text(
                          _isLoading
                              ? 'Processing...'
                              : (!widget.isInItemMode &&
                                    (_productData?['stocks'] ?? 0) == 0)
                              ? 'Out of Stock'
                              : (isInMode ? 'Stock In' : 'Stock Out'),
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Cancel Button
                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: OutlinedButton(
                        onPressed: _isLoading
                            ? null
                            : () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Colors.grey),
                          backgroundColor: Colors.grey[100],
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        child: Text(
                          'Cancel',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[700],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

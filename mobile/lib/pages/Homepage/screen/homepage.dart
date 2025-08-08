import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'camera_scanner_page.dart';
import 'quantity_input_page.dart';

class HomePage extends StatefulWidget {
  final String? scanResult;
  
  const HomePage({super.key, this.scanResult});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with SingleTickerProviderStateMixin {
  String _scanResult = 'No barcode scanned yet';
  final TextEditingController _barcodeController = TextEditingController();
  bool _isInItemMode = true; // true for "in item", false for "out item"

  @override
  void initState() {
    super.initState();
    if (widget.scanResult != null) {
      _scanResult = widget.scanResult!;
    }
  }

  void _showManualInputDialog(BuildContext context) {
    _barcodeController.clear();
    _isInItemMode = true; // Reset to default mode
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Column(
                children: [
                  Text(
                    'Manual Barcode Input',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                  const SizedBox(height: 10),
                  // Mode Switch
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _isInItemMode ? 'IN' : 'OUT',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: _isInItemMode ? Colors.green : Colors.red,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Switch(
                          value: _isInItemMode,
                          onChanged: (value) {
                            setDialogState(() {
                              _isInItemMode = value;
                            });
                          },
                          activeColor: Colors.green,
                          inactiveThumbColor: Colors.red,
                          inactiveTrackColor: Colors.red.withOpacity(0.3),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _isInItemMode ? 'Adding Items' : 'Removing Items',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _isInItemMode ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(height: 10),
                    TextField(
                      controller: _barcodeController,
                      decoration: InputDecoration(
                        hintText: 'Enter barcode number',
                        hintStyle: GoogleFonts.poppins(),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.qr_code),
                        labelText: 'Barcode',
                      ),
                      keyboardType: TextInputType.number,
                      autofocus: true,
                    ),
                    const SizedBox(height: 15),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _isInItemMode ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _isInItemMode ? Colors.green : Colors.red,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _isInItemMode ? Icons.add_circle : Icons.remove_circle,
                            color: _isInItemMode ? Colors.green : Colors.red,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _isInItemMode 
                                ? 'Items will be added to inventory'
                                : 'Items will be removed from inventory',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: _isInItemMode ? Colors.green : Colors.red,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('Cancel', style: GoogleFonts.poppins(color: Colors.grey[700])),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (_barcodeController.text.isNotEmpty) {
                      final barcode = _barcodeController.text.trim();
                      Navigator.of(context).pop();
                      
                      // Navigate to quantity input page
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => QuantityInputPage(
                            barcode: barcode,
                            isInItemMode: _isInItemMode,
                          ),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please enter a barcode'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1a237e),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Proceed', style: GoogleFonts.poppins(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _barcodeController.dispose();
    super.dispose();
  }


  Widget _buildButton({
    required String text,
    required IconData icon,
    required VoidCallback onPressed,
    Color? backgroundColor,
    Color? textColor,
    Color? borderColor,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 55,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 24),
        label: Text(
          text,
          style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w600),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? const Color(0xFF1a237e),
          foregroundColor: textColor ?? Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
            side: borderColor != null ? BorderSide(color: borderColor) : BorderSide.none,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gradient = const LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Colors.white, Color(0xFFf8f9ff)],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'MOM TRADING AND SERVICES',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(gradient: gradient),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App Icon
                AnimatedContainer(
                  duration: const Duration(milliseconds: 500),
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF1a237e), Color(0xFF3949ab)],
                    ),
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1a237e).withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.qr_code_scanner, size: 70, color: Colors.white),
                ),
                const SizedBox(height: 40),

                // Title
                Text(
                  'MOM TRADING AND SERVICES',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    color: const Color(0xFF1a237e),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Scan barcodes to manage your stock',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    color: const Color(0xFF666666),
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.3,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                // Buttons
                _buildButton(
                  text: 'Camera Scanner',
                  icon: Icons.camera_alt,
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const CameraScannerPage()));
                  },
                ),
                const SizedBox(height: 15),
                _buildButton(
                  text: 'Manual Barcode Input',
                  icon: Icons.keyboard,
                  onPressed: () => _showManualInputDialog(context),
                  backgroundColor: Colors.blue[50],
                  textColor: Colors.blue[800],
                  borderColor: Colors.blue[200],
                ),
                const SizedBox(height: 20),

                // Scan Result
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: double.infinity,
                  padding: const EdgeInsets.all(25),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.grey[200]!),
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
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1a237e).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.history, color: Color(0xFF1a237e), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Last Scan Result:',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF1a237e),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(15),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey[200]!),
                        ),
                        child: Text(
                          _scanResult,
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
